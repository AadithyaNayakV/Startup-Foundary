from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from uuid import UUID


# Auth Schemas
class TokenRequest(BaseModel):
    id_token: str


class RoleRequest(BaseModel):
    role: str


class UserProfileUpdate(BaseModel):
    name: str
    bio: Optional[str] = None
    linkedin_url: Optional[str] = None
    focus_domains: Optional[List[str]] = None
    preferred_stage: Optional[str] = None


class UserResponse(BaseModel):
    id: UUID
    email: str
    name: Optional[str] = None
    role: Optional[str] = None
    bio: Optional[str] = None
    linkedin_url: Optional[str] = None
    is_approved: bool = False
    focus_domains: Optional[List[str]] = None
    preferred_stage: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# Startup Schemas
class TeamMemberResponse(BaseModel):
    id: str
    name: Optional[str] = None
    email: str
    role: str


class StartupCreate(BaseModel):
    name: str
    tagline: str
    description: Optional[str] = None
    stage: str = "idea"
    domains: List[str] = []
    funding_needed: Optional[str] = None
    website_url: Optional[str] = None
    logo_url: Optional[str] = None
    pitch_deck_url: Optional[str] = None
    co_founder_emails: List[str] = []


class StartupUpdate(BaseModel):
    name: Optional[str] = None
    tagline: Optional[str] = None
    description: Optional[str] = None
    stage: Optional[str] = None
    domains: Optional[List[str]] = None
    funding_needed: Optional[str] = None
    website_url: Optional[str] = None
    logo_url: Optional[str] = None
    pitch_deck_url: Optional[str] = None


class StartupResponse(BaseModel):
    id: str
    name: str
    tagline: str
    description: Optional[str] = None
    stage: str
    status: str
    created_at: Optional[datetime] = None
    domains: List[str] = []
    funding_needed: Optional[str] = None
    website_url: Optional[str] = None
    logo_url: Optional[str] = None
    pitch_deck_url: Optional[str] = None
    approved_at: Optional[datetime] = None
    completeness_score: Optional[int] = None
    missing: Optional[List[str]] = None
    save_count: Optional[int] = 0
    is_saved: Optional[bool] = False
    team_members: Optional[List[TeamMemberResponse]] = []

    model_config = ConfigDict(from_attributes=True)


# Feed Schemas
class PostCreate(BaseModel):
    content: str


class ReplyCreate(BaseModel):
    content: str


class PostReplyResponse(BaseModel):
    id: str
    post_id: str
    author_id: str
    author_name: Optional[str] = None
    author_role: Optional[str] = None
    content: str
    created_at: Optional[datetime] = None


class PostResponse(BaseModel):
    id: str
    author_id: str
    author_name: Optional[str] = None
    author_role: Optional[str] = None
    content: str
    created_at: Optional[datetime] = None
    reply_count: int = 0


# Messaging Schemas
class ConversationCreate(BaseModel):
    startup_id: str


class MessageCreate(BaseModel):
    body: str


class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    sender_id: str
    body: str
    created_at: Optional[datetime] = None


class ConversationResponse(BaseModel):
    id: str
    startup_id: str
    startup_name: Optional[str] = None
    investor_id: str
    founder_id: str
    created_at: Optional[datetime] = None
    unread: bool = False


# Admin Schemas
class AdminDecision(BaseModel):
    reason: Optional[str] = None


class AdminActionResponse(BaseModel):
    id: str
    admin_email: Optional[str] = None
    target_type: str
    target_id: str
    action: str
    reason: Optional[str] = None
    created_at: Optional[datetime] = None


class AdminQueueResponse(BaseModel):
    users: List[UserResponse]
    startups: List[StartupResponse]


class AdminStatsResponse(BaseModel):
    pending_users: int
    pending_startups: int
    total_users: int
    total_startups: int
    approved_startups: int
