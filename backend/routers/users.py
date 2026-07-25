from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User
from core.security import get_current_user
from schemas import UserProfileUpdate, UserResponse

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserResponse)
async def get_my_profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me")
async def update_my_profile(
    profile_data: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    current_user.name = profile_data.name
    current_user.bio = profile_data.bio
    current_user.linkedin_url = profile_data.linkedin_url
    if profile_data.focus_domains is not None:
        current_user.focus_domains = profile_data.focus_domains
    if profile_data.preferred_stage is not None:
        current_user.preferred_stage = profile_data.preferred_stage

    db.commit()
    return {"success": True, "message": "Profile updated successfully."}
