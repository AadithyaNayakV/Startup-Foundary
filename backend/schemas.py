from pydantic import BaseModel
from typing import Optional
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

    class Config:
        from_attributes = True