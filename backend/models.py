from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean, Text, Integer, Float, JSON
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.sql import func
import uuid
from database import Base
from sqlalchemy import UniqueConstraint

# ... (your existing User and Startup classes are up here) ...


class StartupMember(Base):
    __tablename__ = "startup_members"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    startup_id = Column(UUID(as_uuid=True), ForeignKey("startups.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    role = Column(String, default="ceo")  # 'ceo' or 'cofounder'

    # This enforces your rule: UNIQUE(startup_id, user_id)
    __table_args__ = (
        UniqueConstraint("startup_id", "user_id", name="_startup_user_uc"),
    )


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    firebase_uid = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=True)
    email = Column(String, unique=True, index=True, nullable=False)
    role = Column(String, nullable=True)  # 'founder', 'investor', 'admin', or null
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    bio = Column(String, nullable=True)  # For the "About" section
    linkedin_url = Column(String, nullable=True)
    is_approved = Column(Boolean, default=False)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    focus_domains = Column(ARRAY(String), default=[])
    preferred_stage = Column(String, nullable=True)
    domain_investment_counts = Column(JSON, nullable=True, default={})
    top_focus_domain = Column(String, nullable=True)
    total_deals_count = Column(Integer, nullable=True, default=0)


class Startup(Base):
    __tablename__ = "startups"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    tagline = Column(String, nullable=False)
    description = Column(String)
    stage = Column(String, default="idea")
    status = Column(String, default="pending")  # pending, approved, rejected
    approval_status = Column(String, default="pending")  # pending, approved, rejected
    has_pending_update = Column(Boolean, default=False)
    pending_data = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    # Add other fields (domains, funding_needed, etc.) as needed
    domains = Column(ARRAY(String), default=[])  # e.g., ["AI", "Healthcare", "SaaS"]
    funding_needed = Column(String, nullable=True)  # e.g., "$500k Pre-Seed"
    website_url = Column(String, nullable=True)
    logo_url = Column(String, nullable=True)
    pitch_deck_url = Column(String, nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    approval_notes = Column(Text, nullable=True)

    # Shark Tank AI Deal Evaluator & Financial Traction Fields
    ask_amount = Column(Float, nullable=True)
    equity_offered = Column(Float, nullable=True)
    implied_valuation = Column(Float, nullable=True)
    use_of_funds = Column(String, nullable=True)
    mrr = Column(Float, nullable=True)
    growth_rate_pct = Column(Float, nullable=True)
    burn_rate = Column(Float, nullable=True)
    runway_months = Column(Integer, nullable=True)
    gross_margin_pct = Column(Float, nullable=True)
    total_raised = Column(Float, nullable=True)
    main_competitors = Column(String, nullable=True)
    moat_description = Column(Text, nullable=True)
    ai_score = Column(Integer, nullable=True)
    ai_verdict = Column(String, nullable=True)
    ai_score_breakdown = Column(JSON, nullable=True)


class StartupMember(Base):
    __tablename__ = "startup_members"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    startup_id = Column(UUID(as_uuid=True), ForeignKey("startups.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    role = Column(String, nullable=False, default="cofounder")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("startup_id", "user_id", name="_startup_user_member_uc"),
        {"extend_existing": True},
    )


class StartupSave(Base):
    __tablename__ = "startup_saves"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    startup_id = Column(UUID(as_uuid=True), ForeignKey("startups.id"), nullable=False)
    investor_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("startup_id", "investor_id", name="_startup_investor_uc"),
    )


class Post(Base):
    __tablename__ = "posts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    author_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    author_role = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class PostReply(Base):
    __tablename__ = "post_replies"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    post_id = Column(UUID(as_uuid=True), ForeignKey("posts.id"), nullable=False)
    author_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    startup_id = Column(UUID(as_uuid=True), ForeignKey("startups.id"), nullable=False)
    investor_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    founder_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint(
            "startup_id", "investor_id", name="_startup_investor_convo_uc"
        ),
    )


class Message(Base):
    __tablename__ = "messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(
        UUID(as_uuid=True), ForeignKey("conversations.id"), nullable=False
    )
    sender_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    body = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ConversationRead(Base):
    __tablename__ = "conversation_reads"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(
        UUID(as_uuid=True), ForeignKey("conversations.id"), nullable=False
    )
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    last_read_at = Column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        UniqueConstraint(
            "conversation_id", "user_id", name="_conversation_user_read_uc"
        ),
    )


class AdminAction(Base):
    __tablename__ = "admin_actions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    admin_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    target_type = Column(String, nullable=False)
    target_id = Column(UUID(as_uuid=True), nullable=False)
    action = Column(String, nullable=False)
    reason = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
