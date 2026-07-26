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

import math
from typing import List, Optional
from sqlalchemy import case, func, or_
from schemas import UserProfileUpdate, UserResponse, InvestorFocusUpdate, PaginatedResponse


@router.get("/investors", response_model=PaginatedResponse)
async def get_investors(
    domain: Optional[str] = None,
    page: int = 1,
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(User).filter(User.role == "investor", User.is_approved == True)

    investors = query.all()

    if domain and domain.strip():
        dom_clean = domain.strip().lower()
        matched = []
        unmatched = []
        for inv in investors:
            top = (inv.top_focus_domain or "").lower()
            focuses = [f.lower() for f in (inv.focus_domains or [])]
            if dom_clean in top or top in dom_clean or any(dom_clean in f or f in dom_clean for f in focuses):
                matched.append(inv)
            else:
                unmatched.append(inv)

        matched.sort(key=lambda x: (x.total_deals_count or 0), reverse=True)
        unmatched.sort(key=lambda x: (x.total_deals_count or 0), reverse=True)
        investors = matched + unmatched
    else:
        investors.sort(key=lambda x: (x.total_deals_count or 0), reverse=True)

    total_count = len(investors)
    safe_page = max(1, page)
    safe_limit = max(1, min(limit, 50))
    total_pages = math.ceil(total_count / safe_limit) if total_count > 0 else 1

    start = (safe_page - 1) * safe_limit
    end = start + safe_limit
    page_items = investors[start:end]

    items = [UserResponse.model_validate(inv) for inv in page_items]

    return {
        "items": items,
        "page": safe_page,
        "limit": safe_limit,
        "total_count": total_count,
        "total_pages": total_pages,
        "has_next": safe_page < total_pages,
        "has_prev": safe_page > 1,
    }


@router.get("/search", response_model=List[UserResponse])
async def search_users(
    q: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(User)
    if q and q.strip():
        term_clean = q.strip().lower()
        term_exact = term_clean
        term_prefix = f"{term_clean}%"
        term_contains = f"%{term_clean}%"

        query = query.filter(
            or_(
                func.lower(User.name).like(term_contains),
                func.lower(User.email).like(term_contains),
            )
        )

        priority_order = case(
            (func.lower(User.name) == term_exact, 1),
            (func.lower(User.email) == term_exact, 1),
            (func.lower(User.name).like(term_prefix), 2),
            (func.lower(User.email).like(term_prefix), 2),
            else_=3,
        )

        query = query.order_by(
            priority_order,
            case((User.is_approved == True, 1), else_=2),
            User.name.asc(),
        )
    else:
        query = query.order_by(
            case((User.is_approved == True, 1), else_=2),
            User.name.asc(),
        )

    users = query.limit(10).all()
    return users


@router.post("/me/investor-focus", response_model=UserResponse)
async def update_investor_focus(
    focus_data: InvestorFocusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    counts = focus_data.domain_investment_counts or {}
    current_user.domain_investment_counts = counts

    if focus_data.preferred_stage:
        current_user.preferred_stage = focus_data.preferred_stage

    if counts:
        top_domain = max(counts.items(), key=lambda x: x[1])[0]
        current_user.top_focus_domain = top_domain
        current_user.total_deals_count = sum(counts.values())
        current_user.focus_domains = list(counts.keys())
    else:
        current_user.top_focus_domain = None
        current_user.total_deals_count = 0

    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/{user_id}/profile", response_model=UserResponse)
@router.get("/{user_id}", response_model=UserResponse)
async def get_user_profile(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        user = db.query(User).filter(User.firebase_uid == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User profile not found")
    return user
