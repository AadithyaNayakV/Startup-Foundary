from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from database import get_db
from core.security import get_current_user
from models import User, Startup, AdminAction
from schemas import AdminDecision, AdminActionResponse, AdminStatsResponse
from routers.startup import serialize_startup

router = APIRouter(prefix="/admin", tags=["Admin"])


def require_admin(user: User):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required.")


def serialize_action(action: AdminAction, admin_email: str | None) -> dict:
    return {
        "id": str(action.id),
        "admin_email": admin_email,
        "target_type": action.target_type,
        "target_id": str(action.target_id),
        "action": action.action,
        "reason": action.reason,
        "created_at": action.created_at,
    }


@router.get("/queue")
async def get_admin_queue(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    require_admin(current_user)

    pending_users = (
        db.query(User)
        .filter(User.role.in_(["founder", "investor"]), User.is_approved == False)
        .all()
    )

    pending_startups = db.query(Startup).filter(Startup.status == "pending").all()
    serialized_startups = [
        serialize_startup(s, db=db) for s in pending_startups
    ]

    return {"users": pending_users, "startups": serialized_startups}


@router.get("/stats", response_model=AdminStatsResponse)
async def get_admin_stats(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    require_admin(current_user)

    pending_users = (
        db.query(func.count(User.id))
        .filter(User.role.in_(["founder", "investor"]), User.is_approved == False)
        .scalar()
    )
    pending_startups = (
        db.query(func.count(Startup.id)).filter(Startup.status == "pending").scalar()
    )
    total_users = db.query(func.count(User.id)).scalar()
    total_startups = db.query(func.count(Startup.id)).scalar()
    approved_startups = (
        db.query(func.count(Startup.id)).filter(Startup.status == "approved").scalar()
    )

    return {
        "pending_users": int(pending_users or 0),
        "pending_startups": int(pending_startups or 0),
        "total_users": int(total_users or 0),
        "total_startups": int(total_startups or 0),
        "approved_startups": int(approved_startups or 0),
    }


@router.get("/audit")
async def get_admin_audit_log(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    require_admin(current_user)

    rows = (
        db.query(AdminAction, User)
        .join(User, AdminAction.admin_id == User.id)
        .order_by(AdminAction.created_at.desc())
        .limit(200)
        .all()
    )

    return [serialize_action(action, admin.email) for action, admin in rows]


@router.post("/users/{user_id}/approve")
async def approve_user(
    user_id: str,
    decision: AdminDecision,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_admin(current_user)

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_approved = True
    user.approved_at = datetime.utcnow()
    db.add(
        AdminAction(
            admin_id=current_user.id,
            target_type="user",
            target_id=user.id,
            action="approve",
            reason=decision.reason,
        )
    )
    db.commit()

    return {"success": True}


@router.post("/users/{user_id}/reject")
async def reject_user(
    user_id: str,
    decision: AdminDecision,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_admin(current_user)

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_approved = False
    db.add(
        AdminAction(
            admin_id=current_user.id,
            target_type="user",
            target_id=user.id,
            action="reject",
            reason=decision.reason,
        )
    )
    db.commit()

    return {"success": True}


from services.scraper import scrape_market_intelligence


def compute_ai_score(startup: Startup, market_info: dict = None) -> tuple[int, str, dict]:
    """
    Evaluates financial metrics, ask/equity, unit economics, moat, and live market web intelligence.
    Returns (ai_score: int 0-100, ai_verdict: str, ai_score_breakdown: dict).
    """
    strengths = []
    red_flags = []

    if not market_info:
        market_info = scrape_market_intelligence(startup.domains, startup.website_url)

    # 1. Valuation Realism (0-25 pts)
    valuation_score = 15
    mrr = startup.mrr or 0
    arr = mrr * 12
    implied_val = startup.implied_valuation or 0
    ask = startup.ask_amount or 0
    equity = startup.equity_offered or 0

    if implied_val <= 0 and ask > 0 and equity > 0:
        implied_val = ask / (equity / 100.0)

    if arr > 0 and implied_val > 0:
        multiple = implied_val / arr
        if multiple <= 15:
            valuation_score = 25
            strengths.append(f"Fair valuation multiple ({multiple:.1f}x ARR).")
        elif multiple <= 30:
            valuation_score = 20
            strengths.append(f"Standard growth valuation multiple ({multiple:.1f}x ARR).")
        elif multiple <= 50:
            valuation_score = 12
            red_flags.append(f"High valuation multiple ({multiple:.1f}x ARR).")
        else:
            valuation_score = 5
            red_flags.append(f"Extremely aggressive valuation ({multiple:.1f}x ARR).")
    elif startup.stage in ["idea", "mvp"]:
        if implied_val > 0 and implied_val <= 5000000:
            valuation_score = 20
            strengths.append("Reasonable early-stage valuation cap.")
        elif implied_val > 5000000:
            valuation_score = 10
            red_flags.append("High valuation for early idea/MVP stage.")

    # 2. Traction & Growth (0-25 pts)
    traction_score = 10
    growth = startup.growth_rate_pct or 0
    if mrr >= 50000:
        traction_score += 10
        strengths.append(f"Strong monthly revenue (${mrr:,.0f} MRR).")
    elif mrr >= 10000:
        traction_score += 6
        strengths.append(f"Proven revenue traction (${mrr:,.0f} MRR).")

    if growth >= 20:
        traction_score += 5
        strengths.append(f"Hyper-growth rate (+{growth:.0f}% MoM).")
    elif growth >= 10:
        traction_score += 3
    elif growth < 0:
        red_flags.append("Negative revenue growth rate.")

    traction_score = min(25, traction_score)

    # 3. Unit Economics & Runway (0-25 pts)
    margin_score = 10
    gross_margin = startup.gross_margin_pct or 0
    runway = startup.runway_months or 0

    if gross_margin >= 70:
        margin_score += 10
        strengths.append(f"High gross margin software profile ({gross_margin:.0f}%).")
    elif gross_margin >= 50:
        margin_score += 6
    elif 0 < gross_margin < 30:
        red_flags.append(f"Low gross margin ({gross_margin:.0f}%).")

    if runway >= 12:
        margin_score += 5
        strengths.append(f"Healthy runway ({runway} months remaining).")
    elif 0 < runway < 6:
        red_flags.append(f"Short runway ({runway} months left until capital depletion).")

    margin_score = min(25, margin_score)

    # 4. Moat, Defensibility & Scraped Market Intelligence (0-25 pts)
    moat_score = 10
    if startup.moat_description and len(startup.moat_description.strip()) > 20:
        moat_score += 10
        strengths.append("Clear competitive moat and defensibility strategy articulated.")
    elif not startup.moat_description:
        red_flags.append("Lack of defined competitive moat or defensibility.")

    if startup.pitch_deck_url:
        moat_score += 3
        strengths.append("Comprehensive pitch deck attached.")

    # Incorporate scraped web metadata & domain trends
    if market_info.get("scraped_meta_title"):
        moat_score += 2
        strengths.append(f"Live website verified: '{market_info['scraped_meta_title']}'.")

    if market_info.get("growth_signals"):
        for signal in market_info["growth_signals"][:2]:
            strengths.append(f"Market signal alignment: {signal}.")

    moat_score = min(25, moat_score)

    total_score = valuation_score + traction_score + margin_score + moat_score
    total_score = max(10, min(99, total_score))

    if total_score >= 75:
        verdict = "Strong Investment Opportunity"
    elif total_score >= 50:
        verdict = "Balanced Deal - Further Due Diligence Recommended"
    else:
        verdict = "High Risk / Overvalued Deal"

    breakdown = {
        "valuation_score": valuation_score,
        "traction_score": traction_score,
        "margin_score": margin_score,
        "moat_score": moat_score,
        "market_size_estimate": market_info.get("market_size_estimate", ""),
        "domain_trends": market_info.get("domain_insights", ""),
        "strengths": strengths if strengths else ["Team assembled", "Clear business concept"],
        "red_flags": red_flags if red_flags else ["Early stage metrics pending detailed audit"],
    }

    return total_score, verdict, breakdown


@router.post("/startups/{startup_id}/approve")
async def approve_startup(
    startup_id: str,
    decision: AdminDecision,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_admin(current_user)

    startup = db.query(Startup).filter(Startup.id == startup_id).first()
    if not startup:
        raise HTTPException(status_code=404, detail="Startup not found")

    # 1. If has_pending_update, merge pending_data into public columns
    if startup.has_pending_update and startup.pending_data:
        pdata = dict(startup.pending_data)
        for key, val in pdata.items():
            if key not in ["co_founder_emails", "team_members"] and hasattr(startup, key):
                setattr(startup, key, val)

        if "team_members" in pdata and isinstance(pdata["team_members"], list):
            target_map = {
                tm["user_id"]: tm.get("role", "cofounder")
                for tm in pdata["team_members"]
                if isinstance(tm, dict) and tm.get("user_id")
            }
            existing_members = (
                db.query(StartupMember)
                .filter(StartupMember.startup_id == startup.id)
                .all()
            )
            for m in existing_members:
                if m.role != "ceo" and str(m.user_id) not in target_map:
                    db.delete(m)
                elif str(m.user_id) in target_map:
                    m.role = target_map[str(m.user_id)]

            existing_uids = {str(m.user_id) for m in existing_members}
            for uid, r in target_map.items():
                if uid not in existing_uids:
                    db.add(StartupMember(startup_id=startup.id, user_id=uid, role=r))

        startup.pending_data = None
        startup.has_pending_update = False

    startup.status = "approved"
    startup.approval_status = "approved"
    startup.approved_at = datetime.utcnow()
    startup.approval_notes = decision.reason

    # 2. Extract live market intelligence & scrape website metadata
    market_info = scrape_market_intelligence(startup.domains, startup.website_url)

    # 3. Run AI Investment Scoring Engine with scraped market intelligence
    score, verdict, breakdown = compute_ai_score(startup, market_info)
    startup.ai_score = score
    startup.ai_verdict = verdict
    startup.ai_score_breakdown = breakdown

    db.add(
        AdminAction(
            admin_id=current_user.id,
            target_type="startup",
            target_id=startup.id,
            action="approve",
            reason=decision.reason,
        )
    )
    db.commit()

    return {
        "success": True,
        "ai_score": score,
        "ai_verdict": verdict,
        "ai_score_breakdown": breakdown,
    }


@router.post("/startups/{startup_id}/reject")
async def reject_startup(
    startup_id: str,
    decision: AdminDecision,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_admin(current_user)

    startup = db.query(Startup).filter(Startup.id == startup_id).first()
    if not startup:
        raise HTTPException(status_code=404, detail="Startup not found")

    startup.status = "rejected"
    startup.approval_status = "rejected"
    startup.approval_notes = decision.reason

    db.add(
        AdminAction(
            admin_id=current_user.id,
            target_type="startup",
            target_id=startup.id,
            action="reject",
            reason=decision.reason,
        )
    )
    db.commit()

    return {"success": True}
