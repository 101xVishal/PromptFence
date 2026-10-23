from __future__ import annotations

from pydantic import BaseModel, Field


class SettingsOut(BaseModel):
    chatbot_name: str
    public_faq: str
    synthetic_secret: str
    system_instructions: str
    environment: str = "local_demo"


class SettingsUpdate(BaseModel):
    chatbot_name: str | None = Field(default=None, max_length=120)
    public_faq: str | None = Field(default=None, max_length=5000)
    synthetic_secret: str | None = Field(default=None, max_length=120)
    system_instructions: str | None = Field(default=None, max_length=5000)
