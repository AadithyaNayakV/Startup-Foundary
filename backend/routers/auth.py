from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from firebase_admin import auth as firebase_auth
from database import get_db
from models import User
from schemas import TokenRequest, RoleRequest, UserResponse
from core.security import create_session_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/google")
async def verify_google_login(request: TokenRequest, response: Response, db: Session = Depends(get_db)):
    try:
        decoded_token = firebase_auth.verify_id_token(request.id_token)
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

        token = create_session_token(uid=user.firebase_uid, role=user.role)
        
        # This cookie works for BOTH frontend Axios (CSR) and Next.js Fetch (SSR)
        response.set_cookie(
            key="session",
            value=token,
            httponly=True,
            secure=True, 
            samesite="lax",
            max_age=7 * 24 * 60 * 60 
        )

        return {"success": True, "is_new": is_new, "role": user.role}
    except Exception as e:
        # ADD THIS PRINT STATEMENT
        print(f"🔥 FIREBASE ERROR: {str(e)}") 
        raise HTTPException(status_code=401, detail=f"Auth Failed: {str(e)}")

@router.post("/set-role")
async def set_user_role(request: RoleRequest, response: Response, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role is not None:
        raise HTTPException(status_code=403, detail="Role is permanently locked.")

    if request.role not in ["founder", "investor"]:
        raise HTTPException(status_code=400, detail="Invalid role")

    current_user.role = request.role
    db.commit()

    token = create_session_token(uid=current_user.firebase_uid, role=current_user.role)
    response.set_cookie(key="session", value=token, httponly=True, secure=True, samesite="lax")

    return {"success": True, "role": current_user.role}

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(key="session", httponly=True, secure=True, samesite="lax")
    return {"success": True}