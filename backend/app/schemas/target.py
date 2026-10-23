from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class TargetOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    description: str
    target_type: str
    system_instructions: str
    public_faq: str
    synthetic_secret: str
    allowed_capabilities: list[str]
    restricted_capabilities: list[str]
    authorized: bool = True
    created_at: datetime | None = None
    updated_at: datetime | None = None


class TargetUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=120)
    description: str | None = Field(default=None, max_length=500)
    system_instructions: str | None = Field(default=None, max_length=5000)
    public_faq: str | None = Field(default=None, max_length=5000)
    synthetic_secret: str | None = Field(default=None, max_length=120)
