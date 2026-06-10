from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from database import get_db
from models import User
from core.security import get_current_user

router = APIRouter(prefix="/users", tags=["Users"])


# Strict validation for what a user is allowed to update
class UserProfileUpdate(BaseModel):
    name: str
    bio: Optional[str] = None
    linkedin_url: Optional[str] = None
    focus_domains: Optional[List[str]] = None
    preferred_stage: Optional[str] = None


@router.get("/me")
async def get_my_profile(current_user: User = Depends(get_current_user)):
    # Returns the full user profile including the new bio and linkedin fields
    return current_user


@router.put("/me")
async def update_my_profile(
    profile_data: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Update the database columns
    current_user.name = profile_data.name
    current_user.bio = profile_data.bio
    current_user.linkedin_url = profile_data.linkedin_url
    if profile_data.focus_domains is not None:
        current_user.focus_domains = profile_data.focus_domains
    if profile_data.preferred_stage is not None:
        current_user.preferred_stage = profile_data.preferred_stage

    db.commit()
    return {"success": True, "message": "Profile updated successfully."}
