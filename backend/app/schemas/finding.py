from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class FindingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    scan_id: int
    test_result_id: int | None = None
    key: str
    title: str
    description: str
    category: str
    severity: str
    confidence: int
    evidence: str
    remediation: str
    status: str
    note: str = ""
    created_at: datetime
    updated_at: datetime | None = None


class FindingUpdate(BaseModel):
    status: str | None = Field(default=None, pattern="^(open|in_progress|resolved|accepted_risk)$")
    note: str | None = Field(default=None, max_length=2000)
