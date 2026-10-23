from __future__ import annotations

from pydantic import BaseModel
from app.schemas.scan import ScanOut


class SeverityCount(BaseModel):
    severity: str
    count: int


class CategoryResult(BaseModel):
    category: str
    total: int
    passed: int
    failed: int
    review: int


class DashboardSummary(BaseModel):
    total_scans: int
    completed_scans: int
    passed_tests: int
    failed_tests: int
    review_tests: int
    attack_success_rate: float | None = None
    baseline_scans_count: int = 0
    protected_scans_count: int = 0
    open_findings_count: int = 0
    critical_findings_count: int = 0
    findings_by_severity: list[SeverityCount] = []
    results_by_category: list[CategoryResult] = []
    recent_scans: list[ScanOut] = []
