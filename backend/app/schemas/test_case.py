from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class TestCaseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    description: str
    category: str
    severity: str
    prompt: str
    expected_behavior: str
    evaluation_rule: str
    remediation: str
    is_attack: bool
    enabled: bool
    tags: str


class TestCaseToggle(BaseModel):
    enabled: bool
