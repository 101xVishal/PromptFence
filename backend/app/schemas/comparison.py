from __future__ import annotations

from pydantic import BaseModel
from app.schemas.scan import ScanOut


class ComparisonRow(BaseModel):
    test_id: str
    name: str
    category: str
    severity: str
    is_attack: bool
    baseline_outcome: str
    protected_outcome: str
    status_change: str  # "BLOCKED_BY_DEFENSE", "PERSISTENT_FAILURE", "CONSISTENT_PASS", "FALSE_POSITIVE", "OTHER"
    explanation: str


class ComparisonResponse(BaseModel):
    scan_a: ScanOut
    scan_b: ScanOut
    matching_test_ids: list[str]
    attack_success_rate_a: float | None
    attack_success_rate_b: float | None
    rate_difference_percentage_points: float | None
    newly_blocked_count: int
    persistent_failures_count: int
    false_positives_count: int
    rows: list[ComparisonRow]
