from __future__ import annotations

from datetime import datetime, timezone
from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class TestResult(Base):
    __tablename__ = "scan_results"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    scan_id: Mapped[int] = mapped_column(ForeignKey("scans.id", ondelete="CASCADE"), index=True)
    test_id: Mapped[str] = mapped_column(ForeignKey("test_cases.id"), index=True)
    outcome: Mapped[str] = mapped_column(String(20))  # "passed", "failed", "review", "error"
    response: Mapped[str] = mapped_column(Text)
    evidence: Mapped[str] = mapped_column(Text)
    explanation: Mapped[str] = mapped_column(Text)
    defense_events: Mapped[str] = mapped_column(Text, default="[]")
    duration_ms: Mapped[int] = mapped_column(Integer, default=0)
    finding_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    scan: Mapped["Scan"] = relationship("Scan", back_populates="results")
    test_case: Mapped["SecurityTestCase"] = relationship("SecurityTestCase")
