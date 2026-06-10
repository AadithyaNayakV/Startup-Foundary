from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Request
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import Startup, User, StartupMember, StartupSave
from core.security import get_current_user
from pydantic import BaseModel
from typing import Optional, List
from pathlib import Path
import uuid

router = APIRouter(prefix="/startups", tags=["Startups"])

UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads"


class StartupCreate(BaseModel):
    name: str
    tagline: str
    description: Optional[str] = None
    stage: str = "idea"
    domains: List[str] = []
    funding_needed: Optional[str] = None
    website_url: Optional[str] = None
    logo_url: Optional[str] = None
    co_founder_emails: List[str] = []  # 🚨 New feature!


class StartupUpdate(BaseModel):
    name: Optional[str] = None
    tagline: Optional[str] = None
    description: Optional[str] = None
    stage: Optional[str] = None
    domains: Optional[List[str]] = None
    funding_needed: Optional[str] = None
    website_url: Optional[str] = None
    logo_url: Optional[str] = None


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


def serialize_startup(startup: Startup, extra: dict = None) -> dict:
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
        "approved_at": startup.approved_at,
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
        status="pending",
    )
    db.add(new_startup)
    db.flush()  # Get the ID without committing yet

    # 2. Add the creator as the CEO
    db.add(
        StartupMember(startup_id=new_startup.id, user_id=current_user.id, role="ceo")
    )

    # 3. Add Co-Founders if their emails exist in the database
    for email in startup_data.co_founder_emails:
        email = email.strip()
        if not email:
            continue

        # Look up the user
        co_founder = db.query(User).filter(User.email == email).first()
        if co_founder:
            # Check if they are already in the team (prevents duplicate errors)
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
    return {"success": True, "startup_id": new_startup.id}


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
        response.append(serialize_startup(startup, score_data))
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
                {
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
                {
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
                {
                    "save_count": save_counts.get(str(startup.id), 0),
                    "is_saved": True,
                },
            )
        )

    return response


# Put this down near the bottom of your startups.py file
@router.get("/{startup_id}")
async def get_startup_by_id(
    startup_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Find the specific startup
    startup = db.query(Startup).filter(Startup.id == startup_id).first()

    if not startup:
        raise HTTPException(status_code=404, detail="Startup not found")

    # Security: If an investor is looking, only show approved startups
    if current_user.role == "investor" and startup.status != "approved":
        raise HTTPException(
            status_code=403, detail="This startup is not yet approved for investors."
        )

    if current_user.role == "founder":
        ensure_founder_membership(startup.id, current_user.id, db)

    if current_user.role == "investor" and not current_user.is_approved:
        raise HTTPException(status_code=403, detail="Investor approval required.")

    save_count = (
        db.query(func.count(StartupSave.id))
        .filter(StartupSave.startup_id == startup.id)
        .scalar()
    )
    is_saved = False
    if current_user.role == "investor":
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

    return serialize_startup(startup, extra)


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

    if payload.name is not None:
        startup.name = payload.name
    if payload.tagline is not None:
        startup.tagline = payload.tagline
    if payload.description is not None:
        startup.description = payload.description
    if payload.stage is not None:
        startup.stage = payload.stage
    if payload.domains is not None:
        startup.domains = payload.domains
    if payload.funding_needed is not None:
        startup.funding_needed = payload.funding_needed
    if payload.website_url is not None:
        startup.website_url = payload.website_url
    if payload.logo_url is not None:
        startup.logo_url = payload.logo_url

    if startup.status == "approved":
        startup.status = "pending"

    db.commit()
    db.refresh(startup)

    score_data = compute_startup_score(startup, db)
    return serialize_startup(startup, score_data)


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
    return {"success": True}
