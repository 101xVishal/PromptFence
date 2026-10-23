from __future__ import annotations

from datetime import datetime, timezone
from sqlalchemy import DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class ChatbotTarget(Base):
    __tablename__ = "chatbot_targets"

    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    description: Mapped[str] = mapped_column(Text)
    target_type: Mapped[str] = mapped_column(String(40), default="synthetic_support")
    system_instructions: Mapped[str] = mapped_column(Text)
    public_faq: Mapped[str] = mapped_column(Text)
    synthetic_secret: Mapped[str] = mapped_column(String(120))
    allowed_capabilities: Mapped[str] = mapped_column(Text, default='["public_faq_lookup", "general_guidance"]')
    restricted_capabilities: Mapped[str] = mapped_column(Text, default='["refund_approval", "permission_change", "admin_data_access"]')
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
