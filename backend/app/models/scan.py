from __future__ import annotations

from datetime import datetime, timezone
from sqlalchemy import DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class Scan(Base):
    __tablename__ = "scans"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(120))
    target_id: Mapped[str] = mapped_column(String(80), default="demo-support")
    mode: Mapped[str] = mapped_column(String(20))  # "baseline" or "protected"
    status: Mapped[str] = mapped_column(String(20), default="completed")  # "queued", "running", "completed", "failed"
    selected_test_ids: Mapped[str] = mapped_column(Text, default="[]")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    duration_ms: Mapped[int] = mapped_column(Integer, default=0)
    error_summary: Mapped[str | None] = mapped_column(Text, nullable=True)

    results: Mapped[list["TestResult"]] = relationship("TestResult", back_populates="scan", cascade="all, delete-orphan")
    findings: Mapped[list["Finding"]] = relationship("Finding", back_populates="scan", cascade="all, delete-orphan")
