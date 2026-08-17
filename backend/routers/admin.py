from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from datetime import datetime
from database import get_db
from core.security import get_current_user
from models import User, Startup, AdminAction, StartupMember
from schemas import AdminDecision, AdminActionResponse, AdminStatsResponse
from routers.startup import serialize_startup
from kafka.manager import kafka_manager
from kafka.topics import KafkaTopics
from kafka.outbox import enqueue_outbox_event

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

    # 1. New startup registrations waiting for initial approval
    new_pending_startups = (
        db.query(Startup)
        .filter(
            or_(
                Startup.status == "pending",
                Startup.approval_status == "pending",
            ),
            Startup.has_pending_update == False,
        )
        .all()
    )

    # 2. Approved startups with pending profile revisions (sensitive fields under review)
    revision_startups = (
        db.query(Startup)
        .filter(
            Startup.has_pending_update == True,
            Startup.pending_data.isnot(None),
        )
        .all()
    )

    serialized_new = [serialize_startup(s, db=db) for s in new_pending_startups]

    field_labels = {
        "name": "Company Name",
        "pitch_deck_url": "Pitch Deck",
        "ask_amount": "Ask Amount ($)",
        "equity_offered": "Equity Offered (%)",
        "implied_valuation": "Implied Valuation ($)",
        "funding_needed": "Funding Needed",
        "total_raised": "Total Raised ($)",
        "team_members": "Team Members",
        "co_founder_emails": "Co-founder Emails",
    }

    serialized_revisions = []
    for s in revision_startups:
        s_dict = serialize_startup(s, db=db)
        diff = []
        pdata = s.pending_data or {}
        for k, new_v in pdata.items():
            old_v = getattr(s, k, None) if hasattr(s, k) else None
            diff.append(
                {
                    "field": k,
                    "label": field_labels.get(k, k.replace("_", " ").title()),
                    "old_value": old_v,
                    "new_value": new_v,
                }
            )
        s_dict["pending_diff"] = diff
        serialized_revisions.append(s_dict)

    return {
        "users": pending_users,
        "startups": serialized_new,
        "revisions": serialized_revisions,
    }


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
        db.query(func.count(Startup.id))
        .filter(
            or_(
                Startup.status == "pending",
                Startup.approval_status == "pending",
                Startup.has_pending_update == True,
            )
        )
        .scalar()
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

    # Atomically enqueue Kafka events into Outbox within the SAME DB transaction
    enqueue_outbox_event(
        db=db,
        topic=KafkaTopics.AUDIT_LOGS,
        payload={
            "admin_id": str(current_user.id),
            "target_type": "user",
            "target_id": str(user.id),
            "action": "approve",
            "reason": decision.reason,
        },
        user_id=str(user.id),
    )
    enqueue_outbox_event(
        db=db,
        topic=KafkaTopics.NOTIFICATION_EMAIL,
        payload={
            "recipient_email": user.email,
            "subject": "Account Approved",
            "body": f"Your Foundry {user.role or 'user'} account has been approved!",
        },
        user_id=str(user.id),
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

    # Atomically enqueue Kafka events into Outbox within the SAME DB transaction
    enqueue_outbox_event(
        db=db,
        topic=KafkaTopics.AUDIT_LOGS,
        payload={
            "admin_id": str(current_user.id),
            "target_type": "user",
            "target_id": str(user.id),
            "action": "reject",
            "reason": decision.reason,
        },
        user_id=str(user.id),
    )

    db.commit()

    return {"success": True}


from services.scraper import scrape_market_intelligence
from services.ai_scorer import evaluate_startup_with_llm


def compute_ai_score(startup: Startup, market_info: dict = None) -> tuple[int, str, dict]:
    """
    Evaluates startup across 4 weighted VC categories using the qwen2.5:7b scoring engine.
    Returns (ai_score: int 0-100, ai_verdict: str, ai_score_breakdown: dict).
    """
    if not market_info:
        market_info = scrape_market_intelligence(
            domains=startup.domains or [],
            website_url=startup.website_url,
            raw_competitors=startup.main_competitors,
        )

    startup_dict = {
        "id": str(startup.id),
        "name": startup.name,
        "tagline": startup.tagline or "",
        "description": startup.description or "",
        "domains": startup.domains or [],
        "stage": startup.stage or "idea",
        "ask_amount": startup.ask_amount or 0.0,
        "equity_offered": startup.equity_offered or 0.0,
        "implied_valuation": startup.implied_valuation or 0.0,
        "use_of_funds": startup.use_of_funds or "",
        "mrr": startup.mrr or 0.0,
        "growth_rate_pct": startup.growth_rate_pct or 0.0,
        "burn_rate": startup.burn_rate or 0.0,
        "runway_months": startup.runway_months or 0,
        "gross_margin_pct": startup.gross_margin_pct or 0.0,
        "total_raised": startup.total_raised or 0.0,
        "main_competitors": startup.main_competitors or "",
        "moat_description": startup.moat_description or "",
        "pitch_deck_url": startup.pitch_deck_url or "",
        "team_info": "Founder background submitted.",
    }

    # Extract pitch deck text if available from AWS S3 or local path
    deck_text = ""
    if startup.pitch_deck_url:
        if "amazonaws.com" in str(startup.pitch_deck_url) or "pitch_decks/" in str(startup.pitch_deck_url):
            try:
                from utils.s3_manager import s3_manager
                from services.pitch_deck_parser import extract_text_from_pdf_bytes
                pdf_bytes = s3_manager.get_pdf_bytes(startup.pitch_deck_url)
                deck_res = extract_text_from_pdf_bytes(pdf_bytes)
                deck_text = deck_res.get("extracted_text", "")
            except Exception as e:
                logger.warning(f"⚠️ S3 pitch deck extraction error during admin scoring: {e}")
        else:
            from services.pitch_deck_parser import resolve_local_upload_path, extract_text_from_pitch_deck_path
            local_deck_path = resolve_local_upload_path(startup.pitch_deck_url)
            if local_deck_path:
                deck_res = extract_text_from_pitch_deck_path(local_deck_path)
                deck_text = deck_res.get("extracted_text", "")
    startup_dict["deck_extracted_text"] = deck_text

    eval_result = evaluate_startup_with_llm(startup_dict, market_info)
    score = eval_result["overall_score"]
    verdict = eval_result["verdict"]
    breakdown = eval_result["ai_score_breakdown"]

    return score, verdict, breakdown


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

    # 2. Extract live market intelligence & scrape website metadata (or offload to worker)
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

    # Atomically enqueue Kafka events into Outbox within the SAME DB transaction
    enqueue_outbox_event(
        db=db,
        topic=KafkaTopics.STARTUP_APPROVED,
        event_type="startup.approved",
        startup_id=str(startup.id),
        payload={
            "startup_id": str(startup.id),
            "approved_by": str(current_user.id),
            "approval_notes": decision.reason,
            "approved_at": startup.approved_at.isoformat() if startup.approved_at else None,
        },
    )
    enqueue_outbox_event(
        db=db,
        topic=KafkaTopics.STARTUP_SCRAPE_REQUESTED,
        event_type="startup.scrape_requested",
        startup_id=str(startup.id),
        payload={
            "startup_id": str(startup.id),
            "domains": startup.domains,
            "website_url": startup.website_url,
        },
    )
    enqueue_outbox_event(
        db=db,
        topic=KafkaTopics.AUDIT_LOGS,
        payload={
            "admin_id": str(current_user.id),
            "target_type": "startup",
            "target_id": str(startup.id),
            "action": "approve",
            "reason": decision.reason,
        },
        startup_id=str(startup.id),
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

    is_already_approved = (
        startup.status == "approved" or startup.approval_status == "approved"
    )

    if is_already_approved and startup.has_pending_update:
        # Rejection of a pending revision only: discard pending_data and reset has_pending_update
        startup.pending_data = None
        startup.has_pending_update = False

        db.add(
            AdminAction(
                admin_id=current_user.id,
                target_type="startup",
                target_id=startup.id,
                action="reject_revision",
                reason=decision.reason,
            )
        )
        enqueue_outbox_event(
            db=db,
            topic=KafkaTopics.AUDIT_LOGS,
            payload={
                "admin_id": str(current_user.id),
                "target_type": "startup",
                "target_id": str(startup.id),
                "action": "reject_revision",
                "reason": decision.reason,
            },
            startup_id=str(startup.id),
        )
        db.commit()
        return {"success": True, "message": "Startup revision rejected."}

    # Full rejection of a new startup application
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

    # Atomically enqueue Kafka events into Outbox within the SAME DB transaction
    enqueue_outbox_event(
        db=db,
        topic=KafkaTopics.STARTUP_REJECTED,
        event_type="startup.rejected",
        startup_id=str(startup.id),
        payload={
            "startup_id": str(startup.id),
            "rejected_by": str(current_user.id),
            "reason": decision.reason,
        },
    )
    enqueue_outbox_event(
        db=db,
        topic=KafkaTopics.AUDIT_LOGS,
        payload={
            "admin_id": str(current_user.id),
            "target_type": "startup",
            "target_id": str(startup.id),
            "action": "reject",
            "reason": decision.reason,
        },
        startup_id=str(startup.id),
    )

    db.commit()

    return {"success": True}


@router.post("/startups/{startup_id}/revisions/approve")
async def approve_startup_revision(
    startup_id: str,
    decision: AdminDecision,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return await approve_startup(
        startup_id=startup_id,
        decision=decision,
        current_user=current_user,
        db=db,
    )


@router.post("/startups/{startup_id}/revisions/reject")
async def reject_startup_revision(
    startup_id: str,
    decision: AdminDecision,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return await reject_startup(
        startup_id=startup_id,
        decision=decision,
        current_user=current_user,
        db=db,
    )
