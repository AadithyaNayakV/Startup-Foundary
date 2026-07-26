import jwt
from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from core.config import settings
from database import get_db
from models import User

def create_session_token(uid: str, role: str = None) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=7)
    payload = {"sub": uid, "role": role, "exp": expire}
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

async def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    # 1. Extract the cookie named 'session'
    token = request.cookies.get("session")
    
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        # 2. Decode the custom JWT
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        uid = payload.get("sub")
        if uid is None:
            raise HTTPException(status_code=401, detail="Invalid token structure")
            
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session expired")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid session token")

    # 3. Verify user exists in DB
    user = db.query(User).filter(User.firebase_uid == uid).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
        
    return user