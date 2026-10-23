from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel, ConfigDict


class DefenseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    category: str
    description: str
    protects_against: str
    limitations: str
    safe_example: str
    enabled: bool
    updated_at: datetime | None = None


class DefenseToggle(BaseModel):
    enabled: bool
