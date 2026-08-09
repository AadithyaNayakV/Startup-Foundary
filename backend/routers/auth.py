from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from firebase_admin import auth as firebase_auth
from database import get_db
from models import User
from datetime import datetime
from schemas import TokenRequest, RoleRequest, UserResponse, AdminLoginRequest
from core.security import create_session_token, get_current_user
from core.config import settings
from kafka.manager import kafka_manager
from kafka.topics import KafkaTopics

router = APIRouter(prefix="/auth", tags=["Auth"])


def get_cookie_settings():
    is_prod = settings.ENVIRONMENT == "production"
    return {
        "key": "session",
        "httponly": True,
        "secure": is_prod,
        "samesite": "lax",
        "max_age": 7 * 24 * 60 * 60,  # 7 days
        "path": "/",
    }


def is_admin_email(email: str) -> bool:
    if not email:
        return False
    admin_list = [
        e.strip().lower() for e in settings.ADMIN_EMAILS.split(",") if e.strip()
    ]
    return email.lower() in admin_list


@router.post("/google")
async def verify_google_login(
    request: TokenRequest, response: Response, db: Session = Depends(get_db)
):
    try:
        decoded_token = firebase_auth.verify_id_token(
            request.id_token, clock_skew_seconds=10
        )
        uid = decoded_token["uid"]
        email = decoded_token.get("email")
        name = decoded_token.get("name")

        user = db.query(User).filter(User.firebase_uid == uid).first()
        is_new = False

        if not user:
            user = User(firebase_uid=uid, email=email, name=name, role=None)
            db.add(user)
            db.commit()
            db.refresh(user)
            is_new = True

        if is_admin_email(user.email) and user.role != "admin":
            user.role = "admin"
            user.is_approved = True
            user.approved_at = datetime.utcnow()
            db.commit()

        token = create_session_token(uid=user.firebase_uid, role=user.role)

        cookie_params = get_cookie_settings()
        cookie_params["value"] = token
        response.set_cookie(**cookie_params)

        if is_new:
            await kafka_manager.publish_event(
                topic=KafkaTopics.USER_REGISTERED,
                event_type="user.registered",
                user_id=str(user.id),
                payload={"user_id": str(user.id), "email": user.email, "name": user.name},
            )

        return {"success": True, "is_new": is_new, "role": user.role, "id": str(user.id)}
    except Exception as e:
        print(f"🔥 FIREBASE ERROR: {str(e)}")
        raise HTTPException(status_code=401, detail=f"Auth Failed: {str(e)}")


@router.post("/set-role")
async def set_user_role(
    request: RoleRequest,
    response: Response,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role == "admin":
        raise HTTPException(
            status_code=403, detail="Admin role cannot be changed here."
        )

    if current_user.role is not None:
        raise HTTPException(status_code=403, detail="Role is permanently locked.")

    if request.role not in ["founder", "investor"]:
        raise HTTPException(status_code=400, detail="Invalid role")

    current_user.role = request.role
    db.commit()

    token = create_session_token(uid=current_user.firebase_uid, role=current_user.role)

    cookie_params = get_cookie_settings()
    cookie_params["value"] = token
    response.set_cookie(**cookie_params)

    topic = KafkaTopics.INVESTOR_REGISTERED if request.role == "investor" else KafkaTopics.USER_REGISTERED
    await kafka_manager.publish_event(
        topic=topic,
        event_type=f"{request.role}.registered",
        user_id=str(current_user.id),
        payload={"user_id": str(current_user.id), "role": current_user.role, "email": current_user.email},
    )

    return {"success": True, "role": current_user.role, "id": str(current_user.id)}


@router.post("/admin-login", response_model=UserResponse)
async def admin_login(
    request: AdminLoginRequest,
    response: Response,
    db: Session = Depends(get_db),
):
    target_email = settings.ADMIN_EMAIL.strip().lower()
    target_password = settings.ADMIN_PASSWORD

    if (
        request.email.strip().lower() != target_email
        or request.password != target_password
    ):
        raise HTTPException(
            status_code=401, detail="Invalid admin credentials"
        )

    # Find or create system admin user
    user = db.query(User).filter(User.email == target_email).first()
    if not user:
        user = User(
            firebase_uid="admin-system-uid",
            email=target_email,
            name="System Admin",
            role="admin",
            is_approved=True,
            approved_at=datetime.utcnow(),
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # Ensure role is admin and approved
        if user.role != "admin" or not user.is_approved:
            user.role = "admin"
            user.is_approved = True
            user.approved_at = datetime.utcnow()
            db.commit()
            db.refresh(user)

    token = create_session_token(uid=user.firebase_uid, role=user.role)

    cookie_params = get_cookie_settings()
    cookie_params["value"] = token
    response.set_cookie(**cookie_params)

    return user


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/refresh", response_model=UserResponse)
async def refresh_session(
    response: Response,
    current_user: User = Depends(get_current_user),
):
    token = create_session_token(uid=current_user.firebase_uid, role=current_user.role)
    cookie_params = get_cookie_settings()
    cookie_params["value"] = token
    response.set_cookie(**cookie_params)
    return current_user


@router.post("/logout")
async def logout(response: Response):
    is_prod = settings.ENVIRONMENT == "production"
    response.set_cookie(
        key="session",
        value="",
        max_age=0,
        expires=0,
        path="/",
        httponly=True,
        samesite="lax",
        secure=is_prod,
    )
    response.delete_cookie(
        key="session",
        path="/",
        httponly=True,
        samesite="lax",
        secure=is_prod,
    )
    return {"success": True}
