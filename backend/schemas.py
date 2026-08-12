from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID


# Auth Schemas
class TokenRequest(BaseModel):
    id_token: str


class AdminLoginRequest(BaseModel):
    email: str
    password: str


class RoleRequest(BaseModel):
    role: str


class UserProfileUpdate(BaseModel):
    name: str
    bio: Optional[str] = None
    linkedin_url: Optional[str] = None
    focus_domains: Optional[List[str]] = None
    preferred_stage: Optional[str] = None


class InvestorFocusUpdate(BaseModel):
    domain_investment_counts: Dict[str, int]
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
    domain_investment_counts: Optional[Dict[str, int]] = {}
    top_focus_domain: Optional[str] = None
    total_deals_count: Optional[int] = 0
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


UserProfileResponse = UserResponse


class PaginatedResponse(BaseModel):
    items: List[Any]
    page: int
    limit: int
    total_count: int
    total_pages: int
    has_next: bool
    has_prev: bool


# Startup Schemas
class StartupMemberCreate(BaseModel):
    user_id: str
    role: str = "cofounder"


class TeamMemberResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    name: Optional[str] = None
    email: str
    role: str
    bio: Optional[str] = None
    linkedin_url: Optional[str] = None


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
    team_members: Optional[List[StartupMemberCreate]] = []
    # Shark Tank & Financial Traction Fields
    ask_amount: Optional[float] = None
    equity_offered: Optional[float] = None
    implied_valuation: Optional[float] = None
    use_of_funds: Optional[str] = None
    mrr: Optional[float] = None
    growth_rate_pct: Optional[float] = None
    burn_rate: Optional[float] = None
    runway_months: Optional[int] = None
    gross_margin_pct: Optional[float] = None
    total_raised: Optional[float] = None
    main_competitors: Optional[str] = None
    moat_description: Optional[str] = None


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
    co_founder_emails: Optional[List[str]] = None
    team_members: Optional[List[StartupMemberCreate]] = None
    # Shark Tank & Financial Traction Fields
    ask_amount: Optional[float] = None
    equity_offered: Optional[float] = None
    implied_valuation: Optional[float] = None
    use_of_funds: Optional[str] = None
    mrr: Optional[float] = None
    growth_rate_pct: Optional[float] = None
    burn_rate: Optional[float] = None
    runway_months: Optional[int] = None
    gross_margin_pct: Optional[float] = None
    total_raised: Optional[float] = None
    main_competitors: Optional[str] = None
    moat_description: Optional[str] = None
    ai_score: Optional[int] = None
    ai_verdict: Optional[str] = None
    ai_score_breakdown: Optional[Dict[str, Any]] = None
    ai_evaluation_status: Optional[str] = None
    pitch_deck_parsed_text: Optional[str] = None


class StartupResponse(BaseModel):
    id: str
    name: str
    tagline: str
    description: Optional[str] = None
    stage: str
    status: str
    approval_status: Optional[str] = "pending"
    has_pending_update: Optional[bool] = False
    pending_data: Optional[Dict[str, Any]] = None
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
    # Shark Tank & Financial Traction Fields
    ask_amount: Optional[float] = None
    equity_offered: Optional[float] = None
    implied_valuation: Optional[float] = None
    use_of_funds: Optional[str] = None
    mrr: Optional[float] = None
    growth_rate_pct: Optional[float] = None
    burn_rate: Optional[float] = None
    runway_months: Optional[int] = None
    gross_margin_pct: Optional[float] = None
    total_raised: Optional[float] = None
    main_competitors: Optional[str] = None
    moat_description: Optional[str] = None
    ai_score: Optional[int] = None
    ai_verdict: Optional[str] = None
    ai_score_breakdown: Optional[Dict[str, Any]] = None
    market_radar_data: Optional[Dict[str, Any]] = None
    ai_evaluation_status: Optional[str] = "pending"
    pitch_deck_parsed_text: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)



# Data Room Schemas
class DataRoomDocumentResponse(BaseModel):
    id: str
    startup_id: str
    file_name: str
    file_url: str
    file_type: str  # "financials", "cap_table", "patent", "other"
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class DataRoomAccessRequestResponse(BaseModel):
    id: str
    startup_id: str
    investor_id: str
    status: str  # "pending", "approved", "rejected"
    requested_at: Optional[datetime] = None
    investor_name: Optional[str] = None
    investor_email: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class DataRoomAccessRequestRespond(BaseModel):
    status: str  # "approved" or "rejected"


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
