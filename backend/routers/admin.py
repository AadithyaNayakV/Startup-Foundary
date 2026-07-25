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

    startup.status = "approved"
    startup.approved_at = datetime.utcnow()
    startup.approval_notes = decision.reason

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

    return {"success": True}


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
