from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Request
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import Startup, User, StartupMember, StartupSave
from core.security import get_current_user
from schemas import StartupCreate, StartupUpdate, StartupResponse, UserResponse
from kafka.manager import kafka_manager
from kafka.topics import KafkaTopics
from typing import Optional, List
from pathlib import Path
import uuid

router = APIRouter(prefix="/startups", tags=["Startups"])

UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads"


def compute_startup_score(startup: Startup, db: Session) -> dict:
    score = 0
    missing = []

    if startup.logo_url:
        score += 30
    else:
        missing.append("logo")

    if startup.website_url:
        score += 30
    else:
        missing.append("website")

    cofounder_count = (
        db.query(StartupMember)
        .filter(
            StartupMember.startup_id == startup.id, StartupMember.role == "cofounder"
        )
        .count()
    )

    if cofounder_count > 0:
        score += 40
    else:
        missing.append("cofounder")

    return {
        "completeness_score": score,
        "missing": missing,
        "cofounder_count": cofounder_count,
    }


def serialize_startup(startup: Startup, db: Session = None, extra: dict = None) -> dict:
    team_members = []
    if db is not None:
        members = (
            db.query(StartupMember, User)
            .join(User, StartupMember.user_id == User.id)
            .filter(StartupMember.startup_id == startup.id)
            .all()
        )
        for member, user in members:
            team_members.append(
                {
                    "id": str(member.id),
                    "user_id": str(user.id),
                    "name": user.name,
                    "email": user.email,
                    "role": member.role,
                    "bio": user.bio,
                    "linkedin_url": user.linkedin_url,
                }
            )

    data = {
        "id": str(startup.id),
        "name": startup.name,
        "tagline": startup.tagline,
        "description": startup.description,
        "stage": startup.stage,
        "status": startup.status,
        "created_at": startup.created_at,
        "domains": startup.domains,
        "funding_needed": startup.funding_needed,
        "website_url": startup.website_url,
        "logo_url": startup.logo_url,
        "pitch_deck_url": startup.pitch_deck_url,
        "approved_at": startup.approved_at,
        "team_members": team_members,
        "ask_amount": startup.ask_amount,
        "equity_offered": startup.equity_offered,
        "implied_valuation": startup.implied_valuation,
        "use_of_funds": startup.use_of_funds,
        "mrr": startup.mrr,
        "growth_rate_pct": startup.growth_rate_pct,
        "burn_rate": startup.burn_rate,
        "runway_months": startup.runway_months,
        "gross_margin_pct": startup.gross_margin_pct,
        "total_raised": startup.total_raised,
        "main_competitors": startup.main_competitors,
        "moat_description": startup.moat_description,
        "ai_score": startup.ai_score,
        "ai_verdict": startup.ai_verdict,
        "ai_score_breakdown": startup.ai_score_breakdown,
    }
    if extra:
        data.update(extra)
    return data


def ensure_founder_membership(startup_id: str, user_id: str, db: Session) -> None:
    is_member = (
        db.query(StartupMember)
        .filter(
            StartupMember.startup_id == startup_id, StartupMember.user_id == user_id
        )
        .first()
    )
    if not is_member:
        raise HTTPException(
            status_code=403, detail="Not authorized to access this startup."
        )


MAX_LOGO_BYTES = 2 * 1024 * 1024
ALLOWED_LOGO_TYPES = {"image/png", "image/jpeg", "image/webp", "image/gif"}


@router.post("/logo-upload")
async def upload_logo(
    request: Request,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "founder":
        raise HTTPException(status_code=403, detail="Only founders can upload logos.")

    if not file.content_type or file.content_type not in ALLOWED_LOGO_TYPES:
        raise HTTPException(
            status_code=400, detail="Only PNG, JPG, WEBP, or GIF images are allowed."
        )

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    file_ext = Path(file.filename or "").suffix or ".png"
    filename = f"{uuid.uuid4().hex}{file_ext}"
    destination = UPLOAD_DIR / filename

    content = await file.read()
    if len(content) > MAX_LOGO_BYTES:
        raise HTTPException(status_code=400, detail="Logo must be 2MB or smaller.")

    with destination.open("wb") as buffer:
        buffer.write(content)

    base_url = str(request.base_url).rstrip("/")
    return {"url": f"{base_url}/uploads/{filename}"}


MAX_DECK_BYTES = 10 * 1024 * 1024
ALLOWED_DECK_TYPES = {
    "application/pdf",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "image/png",
    "image/jpeg",
}


from services.pitch_deck_parser import extract_text_from_pdf_bytes


@router.post("/pitch-deck-upload")
async def upload_pitch_deck(
    request: Request,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "founder":
        raise HTTPException(
            status_code=403, detail="Only founders can upload pitch decks."
        )

    if not file.content_type or file.content_type not in ALLOWED_DECK_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Only PDF, PPT, PPTX, PNG, or JPG files are allowed.",
        )

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    file_ext = Path(file.filename or "").suffix or ".pdf"
    filename = f"{uuid.uuid4().hex}{file_ext}"
    destination = UPLOAD_DIR / filename

    content = await file.read()
    if len(content) > MAX_DECK_BYTES:
        raise HTTPException(
            status_code=400, detail="Pitch deck file must be 10MB or smaller."
        )

    with destination.open("wb") as buffer:
        buffer.write(content)

    base_url = str(request.base_url).rstrip("/")
    parsed_info = {}
    if file_ext.lower() == ".pdf" or file.content_type == "application/pdf":
        parsed_info = extract_text_from_pdf_bytes(content)

    return {
        "url": f"{base_url}/uploads/{filename}",
        "filename": filename,
        "page_count": parsed_info.get("page_count", 0),
        "summary_preview": parsed_info.get("summary_preview", ""),
    }


@router.post("/")
async def create_startup(
    startup_data: StartupCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "founder":
        raise HTTPException(
            status_code=403, detail="Only founders can create a startup."
        )

    # 1. Create the Startup with advanced fields
    new_startup = Startup(
        name=startup_data.name,
        tagline=startup_data.tagline,
        description=startup_data.description,
        stage=startup_data.stage,
        domains=startup_data.domains,
        funding_needed=startup_data.funding_needed,
        website_url=startup_data.website_url,
        logo_url=startup_data.logo_url,
        pitch_deck_url=startup_data.pitch_deck_url,
        ask_amount=startup_data.ask_amount,
        equity_offered=startup_data.equity_offered,
        implied_valuation=startup_data.implied_valuation,
        use_of_funds=startup_data.use_of_funds,
        mrr=startup_data.mrr,
        growth_rate_pct=startup_data.growth_rate_pct,
        burn_rate=startup_data.burn_rate,
        runway_months=startup_data.runway_months,
        gross_margin_pct=startup_data.gross_margin_pct,
        total_raised=startup_data.total_raised,
        main_competitors=startup_data.main_competitors,
        moat_description=startup_data.moat_description,
        status="pending",
    )
    db.add(new_startup)
    db.flush()  # Get the ID without committing yet

    # 2. Add the creator as the CEO
    db.add(
        StartupMember(startup_id=new_startup.id, user_id=current_user.id, role="ceo")
    )

    # 3. Add team members with custom assigned roles
    if startup_data.team_members:
        for tm in startup_data.team_members:
            if tm.user_id and tm.user_id != str(current_user.id):
                user_rec = db.query(User).filter(User.id == tm.user_id).first()
                if user_rec:
                    db.add(
                        StartupMember(
                            startup_id=new_startup.id,
                            user_id=user_rec.id,
                            role=tm.role or "cofounder",
                        )
                    )
    elif startup_data.co_founder_emails:
        for email in startup_data.co_founder_emails:
            email = email.strip()
            if not email:
                continue
            co_founder = (
                db.query(User).filter(func.lower(User.email) == email.lower()).first()
            )
            if co_founder and co_founder.id != current_user.id:
                existing_member = (
                    db.query(StartupMember)
                    .filter_by(startup_id=new_startup.id, user_id=co_founder.id)
                    .first()
                )
                if not existing_member:
                    db.add(
                        StartupMember(
                            startup_id=new_startup.id,
                            user_id=co_founder.id,
                            role="cofounder",
                        )
                    )

    db.commit()
    db.refresh(new_startup)

    # Emit Kafka Event
    await kafka_manager.publish_event(
        topic=KafkaTopics.STARTUP_CREATED,
        event_type="startup.created",
        startup_id=str(new_startup.id),
        user_id=str(current_user.id),
        payload={
            "startup_id": str(new_startup.id),
            "founder_id": str(current_user.id),
            "name": new_startup.name,
            "tagline": new_startup.tagline,
            "stage": new_startup.stage,
            "funding_needed": new_startup.funding_needed,
        },
    )

    return serialize_startup(new_startup, db=db)


@router.get("/me")
async def get_my_startups(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    if current_user.role != "founder":
        raise HTTPException(
            status_code=403, detail="Only founders can view their startups here."
        )

    # Join startups with startup_members to find this specific founder's companies
    my_startups = (
        db.query(Startup)
        .join(StartupMember, Startup.id == StartupMember.startup_id)
        .filter(StartupMember.user_id == current_user.id)
        .all()
    )

    response = []
    for startup in my_startups:
        score_data = compute_startup_score(startup, db)
        response.append(serialize_startup(startup, db=db, extra=score_data))
    return response


@router.get("/")
async def get_all_approved_startups(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    # Investors and Admins can see approved startups.
    if current_user.role not in ["investor", "admin"]:
        raise HTTPException(
            status_code=403, detail="Not authorized to view the startup directory."
        )

    if current_user.role == "investor" and not current_user.is_approved:
        raise HTTPException(status_code=403, detail="Investor approval required.")

    # Strictly fetch only approved startups from the database
    approved_startups = db.query(Startup).filter(Startup.status == "approved").all()

    saved_ids = set()
    save_counts = {}
    if current_user.role == "investor":
        saved_ids = set(
            s.startup_id
            for s in db.query(StartupSave)
            .filter(StartupSave.investor_id == current_user.id)
            .all()
        )

    counts = (
        db.query(StartupSave.startup_id, func.count(StartupSave.id))
        .group_by(StartupSave.startup_id)
        .all()
    )
    for startup_id, count in counts:
        save_counts[str(startup_id)] = count

    response = []
    for startup in approved_startups:
        response.append(
            serialize_startup(
                startup,
                db=db,
                extra={
                    "save_count": save_counts.get(str(startup.id), 0),
                    "is_saved": str(startup.id) in saved_ids,
                },
            )
        )

    return response


@router.get("/trending")
async def get_trending_startups(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    if current_user.role not in ["investor", "admin"]:
        raise HTTPException(
            status_code=403, detail="Not authorized to view the startup directory."
        )

    if current_user.role == "investor" and not current_user.is_approved:
        raise HTTPException(status_code=403, detail="Investor approval required.")

    saved_ids = set()
    if current_user.role == "investor":
        saved_ids = set(
            s.startup_id
            for s in db.query(StartupSave)
            .filter(StartupSave.investor_id == current_user.id)
            .all()
        )

    rows = (
        db.query(Startup, func.count(StartupSave.id).label("save_count"))
        .outerjoin(StartupSave, Startup.id == StartupSave.startup_id)
        .filter(Startup.status == "approved")
        .group_by(Startup.id)
        .order_by(func.count(StartupSave.id).desc(), Startup.created_at.desc())
        .all()
    )

    response = []
    for startup, save_count in rows:
        response.append(
            serialize_startup(
                startup,
                db=db,
                extra={
                    "save_count": int(save_count or 0),
                    "is_saved": str(startup.id) in saved_ids,
                },
            )
        )

    return response


@router.get("/saved")
async def get_saved_startups(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    if current_user.role != "investor":
        raise HTTPException(
            status_code=403, detail="Only investors can view saved startups."
        )

    if not current_user.is_approved:
        raise HTTPException(status_code=403, detail="Investor approval required.")

    rows = (
        db.query(Startup)
        .join(StartupSave, Startup.id == StartupSave.startup_id)
        .filter(StartupSave.investor_id == current_user.id)
        .filter(Startup.status == "approved")
        .all()
    )

    counts = (
        db.query(StartupSave.startup_id, func.count(StartupSave.id))
        .group_by(StartupSave.startup_id)
        .all()
    )
    save_counts = {str(startup_id): count for startup_id, count in counts}

    response = []
    for startup in rows:
        response.append(
            serialize_startup(
                startup,
                db=db,
                extra={
                    "save_count": save_counts.get(str(startup.id), 0),
                    "is_saved": True,
                },
            )
        )

    return response


@router.get("/{startup_id}", response_model=StartupResponse)
async def get_startup_detail(
    startup_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    startup = db.query(Startup).filter(Startup.id == startup_id).first()
    if not startup:
        raise HTTPException(status_code=404, detail="Startup not found")

    is_member = (
        db.query(StartupMember)
        .filter(
            StartupMember.startup_id == startup.id,
            StartupMember.user_id == current_user.id,
        )
        .first()
        is not None
    )

    is_admin = current_user.role == "admin"

    if (
        startup.status != "approved"
        and startup.approval_status != "approved"
        and not is_member
        and not is_admin
    ):
        raise HTTPException(
            status_code=403, detail="Not authorized to view this startup."
        )

    save_count = (
        db.query(func.count(StartupSave.id))
        .filter(StartupSave.startup_id == startup.id)
        .scalar()
    )

    is_saved = False
    if current_user:
        is_saved = (
            db.query(StartupSave)
            .filter(
                StartupSave.startup_id == startup.id,
                StartupSave.investor_id == current_user.id,
            )
            .first()
            is not None
        )

    extra = {"save_count": int(save_count or 0), "is_saved": is_saved}

    return serialize_startup(startup, db=db, extra=extra)


@router.put("/{startup_id}")
async def update_startup(
    startup_id: str,
    payload: StartupUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "founder":
        raise HTTPException(
            status_code=403, detail="Only founders can update startups."
        )

    startup = db.query(Startup).filter(Startup.id == startup_id).first()
    if not startup:
        raise HTTPException(status_code=404, detail="Startup not found")

    ensure_founder_membership(startup.id, current_user.id, db)

    is_approved = (
        startup.status == "approved" or startup.approval_status == "approved"
    )

    update_fields = [
        "name",
        "tagline",
        "description",
        "stage",
        "domains",
        "funding_needed",
        "website_url",
        "logo_url",
        "pitch_deck_url",
        "ask_amount",
        "equity_offered",
        "implied_valuation",
        "use_of_funds",
        "mrr",
        "growth_rate_pct",
        "burn_rate",
        "runway_months",
        "gross_margin_pct",
        "total_raised",
        "main_competitors",
        "moat_description",
    ]

    if is_approved:
        # DO NOT overwrite live public columns directly. Store in pending_data.
        pending_dict = dict(startup.pending_data) if startup.pending_data else {}
        for field in update_fields:
            val = getattr(payload, field, None)
            if val is not None:
                pending_dict[field] = val
        if payload.co_founder_emails is not None:
            pending_dict["co_founder_emails"] = payload.co_founder_emails
        if payload.team_members is not None:
            pending_dict["team_members"] = [tm.model_dump() for tm in payload.team_members]

        startup.pending_data = pending_dict
        startup.has_pending_update = True
    else:
        # Startup is still pending initial approval: update live draft columns directly
        for field in update_fields:
            val = getattr(payload, field, None)
            if val is not None:
                setattr(startup, field, val)

        if payload.team_members is not None:
            existing_members = (
                db.query(StartupMember)
                .filter(StartupMember.startup_id == startup.id)
                .all()
            )
            existing_member_map = {str(m.user_id): m for m in existing_members}
            target_map = {
                tm.user_id: (tm.role or "cofounder")
                for tm in payload.team_members
                if tm.user_id
            }

            # Delete members removed from team (except founder CEO)
            for uid, member in list(existing_member_map.items()):
                if uid != str(current_user.id) and uid not in target_map:
                    db.delete(member)

            # Add or update roles for target members
            for uid, role in target_map.items():
                if uid != str(current_user.id):
                    if uid in existing_member_map:
                        existing_member_map[uid].role = role
                    else:
                        user_rec = db.query(User).filter(User.id == uid).first()
                        if user_rec:
                            db.add(
                                StartupMember(
                                    startup_id=startup.id,
                                    user_id=user_rec.id,
                                    role=role,
                                )
                            )
        elif payload.co_founder_emails is not None:
            existing_cofounder_members = (
                db.query(StartupMember, User)
                .join(User, StartupMember.user_id == User.id)
                .filter(
                    StartupMember.startup_id == startup.id,
                    StartupMember.role == "cofounder",
                )
                .all()
            )

            existing_member_map = {
                user.email.lower(): member
                for member, user in existing_cofounder_members
            }

            target_emails = set(
                email.strip().lower()
                for email in payload.co_founder_emails
                if email and email.strip()
            )

            for email_addr, member in list(existing_member_map.items()):
                if email_addr not in target_emails:
                    db.delete(member)

            for email_addr in target_emails:
                if email_addr not in existing_member_map:
                    user_record = (
                        db.query(User)
                        .filter(func.lower(User.email) == email_addr)
                        .first()
                    )
                    if user_record and user_record.id != current_user.id:
                        db.add(
                            StartupMember(
                                startup_id=startup.id,
                                user_id=user_record.id,
                                role="cofounder",
                            )
                        )

    db.commit()
    db.refresh(startup)

    # Emit Kafka event
    await kafka_manager.publish_event(
        topic=KafkaTopics.STARTUP_UPDATED,
        event_type="startup.updated",
        startup_id=str(startup.id),
        user_id=str(current_user.id),
        payload={
            "startup_id": str(startup.id),
            "updated_by": str(current_user.id),
            "has_pending_update": startup.has_pending_update,
        },
    )

    return serialize_startup(startup, db=db)


@router.post("/{startup_id}/save")
async def save_startup(
    startup_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "investor":
        raise HTTPException(status_code=403, detail="Only investors can save startups.")

    if not current_user.is_approved:
        raise HTTPException(status_code=403, detail="Investor approval required.")

    startup = (
        db.query(Startup)
        .filter(Startup.id == startup_id, Startup.status == "approved")
        .first()
    )
    if not startup:
        raise HTTPException(
            status_code=404, detail="Startup not found or not approved."
        )

    existing = (
        db.query(StartupSave)
        .filter(
            StartupSave.startup_id == startup.id,
            StartupSave.investor_id == current_user.id,
        )
        .first()
    )
    if existing:
        return {"success": True}

    db.add(StartupSave(startup_id=startup.id, investor_id=current_user.id))
    db.commit()

    # Emit Kafka Event
    await kafka_manager.publish_event(
        topic=KafkaTopics.STARTUP_SAVED,
        event_type="startup.saved",
        startup_id=str(startup.id),
        user_id=str(current_user.id),
        payload={
            "startup_id": str(startup.id),
            "investor_id": str(current_user.id),
        },
    )

    return {"success": True}


@router.delete("/{startup_id}/save")
async def unsave_startup(
    startup_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "investor":
        raise HTTPException(status_code=403, detail="Only investors can save startups.")

    save = (
        db.query(StartupSave)
        .filter(
            StartupSave.startup_id == startup_id,
            StartupSave.investor_id == current_user.id,
        )
        .first()
    )
    if not save:
        return {"success": True}

    db.delete(save)
    db.commit()

    # Emit Kafka Event
    await kafka_manager.publish_event(
        topic=KafkaTopics.STARTUP_UNSAVED,
        event_type="startup.unsaved",
        startup_id=str(startup_id),
        user_id=str(current_user.id),
        payload={
            "startup_id": str(startup_id),
            "investor_id": str(current_user.id),
        },
    )

    return {"success": True}


@router.get("/{startup_id}/recommended-investors", response_model=List[UserResponse])
async def get_recommended_investors(
    startup_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    startup = db.query(Startup).filter(Startup.id == startup_id).first()
    if not startup:
        raise HTTPException(status_code=404, detail="Startup not found")

    startup_domains = startup.domains or []
    startup_domains_lower = [d.lower() for d in startup_domains]

    investors = (
        db.query(User)
        .filter(User.role == "investor", User.is_approved == True)
        .all()
    )

    matched_investors = []
    for inv in investors:
        top = (inv.top_focus_domain or "").lower()
        focuses = [f.lower() for f in (inv.focus_domains or [])]

        has_match = False
        if top and any(top in sd or sd in top for sd in startup_domains_lower):
            has_match = True
        elif any(f in sd or sd in f for f in focuses for sd in startup_domains_lower):
            has_match = True

        if has_match or not startup_domains:
            matched_investors.append(inv)

    matched_investors.sort(
        key=lambda x: (
            x.total_deals_count or 0,
            1 if x.top_focus_domain and x.top_focus_domain.lower() in startup_domains_lower else 0,
        ),
        reverse=True,
    )

    return matched_investors[:10]


from services.market_radar import generate_market_radar


@router.post("/{startup_id}/generate-market-radar", response_model=StartupResponse)
async def trigger_market_radar(
    startup_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    startup = db.query(Startup).filter(Startup.id == startup_id).first()
    if not startup:
        raise HTTPException(status_code=404, detail="Startup not found")

    is_owner = startup.owner_id == current_user.id
    is_member = (
        db.query(StartupMember)
        .filter(StartupMember.startup_id == startup.id, StartupMember.user_id == current_user.id)
        .first()
        is not None
    )
    is_admin = current_user.role == "admin"
    if not (is_owner or is_member or is_admin):
        raise HTTPException(
            status_code=403,
            detail="Only startup founders or admins can generate market radar reports",
        )

    radar_report = generate_market_radar(
        name=startup.name,
        domains=startup.domains or [],
        tagline=startup.tagline or "",
        description=startup.description or "",
        website_url=startup.website_url or "",
    )

    startup.market_radar_data = radar_report
    db.commit()
    db.refresh(startup)

    return serialize_startup(startup, db=db, current_user=current_user)
