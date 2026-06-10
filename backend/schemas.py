from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from uuid import UUID


class TokenRequest(BaseModel):
    id_token: str


class RoleRequest(BaseModel):
    role: str


class UserResponse(BaseModel):
    id: UUID
    email: str
    name: Optional[str]
    role: Optional[str]
    focus_domains: Optional[List[str]] = None
    preferred_stage: Optional[str] = None

    class Config:
        from_attributes = True
