from __future__ import annotations

from enum import Enum
from pydantic import BaseModel, Field


class SandboxMode(str, Enum):
    baseline = "baseline"
    protected = "protected"


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    mode: SandboxMode = SandboxMode.protected


class ChatResponse(BaseModel):
    response: str
    mode: SandboxMode
    security_events: list[str]
    model_name: str = "Acme Support Simulator"
    disclaimer: str = "Synthetic educational demonstration. Do not submit production credentials."
