from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from firebase_admin import auth as firebase_auth
from database import get_db
from models import User
from datetime import datetime
from schemas import TokenRequest, RoleRequest, UserResponse
from core.security import create_session_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Auth"])
from core.config import settings


# This dictionary perfectly configures the cookie based on your environment
def get_cookie_settings():
    is_prod = settings.ENVIRONMENT == "production"
    return {
        "key": "session",
        "httponly": True,
        # True in prod (HTTPS), False in dev (HTTP)
        "secure": is_prod,
        # "lax" allows frontend to backend communication on localhost
        # In prod, if API is api.domain.com and frontend is domain.com, use "lax" or "none"
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
        # Allows a 10-second grace period for tokens arriving "from the future"
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

        # Apply the smart settings
        cookie_params = get_cookie_settings()
        cookie_params["value"] = token
        response.set_cookie(**cookie_params)

        return {"success": True, "is_new": is_new, "role": user.role}
    except Exception as e:
        # ADD THIS PRINT STATEMENT
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

    # Apply the smart settings here too
    cookie_params = get_cookie_settings()
    cookie_params["value"] = token
    response.set_cookie(**cookie_params)

    return {"success": True, "role": current_user.role}


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/logout")
async def logout(response: Response):
    cookie_params = get_cookie_settings()
    response.delete_cookie(
        key=cookie_params["key"],
        path=cookie_params["path"],
        samesite=cookie_params["samesite"],
        secure=cookie_params["secure"],
    )
    return {"success": True}
