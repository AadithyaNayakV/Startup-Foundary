import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field


class EventEnvelope(BaseModel):
    event_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_type: str
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    version: str = "1.0"
    source_service: str = "foundry-backend"
    correlation_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    startup_id: Optional[str] = None
    user_id: Optional[str] = None
    payload: Dict[str, Any] = Field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return self.model_dump()


class StartupCreatedPayload(BaseModel):
    startup_id: str
    founder_id: str
    name: str
    tagline: Optional[str] = None
    stage: str
    funding_needed: Optional[float] = None


class StartupApprovedPayload(BaseModel):
    startup_id: str
    approved_by: str
    approval_notes: Optional[str] = None
    approved_at: str


class StartupScrapePayload(BaseModel):
    startup_id: str
    domains: Optional[str] = None
    website_url: Optional[str] = None


class StartupScoredPayload(BaseModel):
    startup_id: str
    ai_score: int
    ai_verdict: str
    ai_score_breakdown: Dict[str, Any]


class UserRegisteredPayload(BaseModel):
    user_id: str
    email: str
    role: Optional[str] = None


class NotificationEmailPayload(BaseModel):
    recipient_email: str
    subject: str
    body: str
    template_id: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class AuditLogPayload(BaseModel):
    actor_id: str
    target_type: str
    target_id: str
    action: str
    reason: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
