from __future__ import annotations

from datetime import datetime
from enum import Enum
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.test_case import TestCaseOut


class ScanMode(str, Enum):
    baseline = "baseline"
    protected = "protected"


class ScanStatus(str, Enum):
    queued = "queued"
    running = "running"
    completed = "completed"
    failed = "failed"


class TestOutcome(str, Enum):
    passed = "passed"
    failed = "failed"
    review = "review"
    error = "error"


class ScanRequest(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    target_id: str = "demo-support"
    mode: ScanMode = ScanMode.baseline
    test_ids: list[str] | None = None
    categories: list[str] | None = None


class TestResultOut(BaseModel):
    id: int
    scan_id: int
    test_id: str
    test: TestCaseOut
    outcome: TestOutcome
    response: str
    evidence: str
    explanation: str
    defense_events: list[str]
    duration_ms: int
    finding_id: int | None = None


class ScanMetrics(BaseModel):
    total: int
    passed: int
    failed: int
    review: int
    error: int
    attack_tests_count: int
    benign_tests_count: int
    attack_success_rate: float | None = None
    test_pass_rate: float | None = None
    benign_false_positive_rate: float | None = None


class ScanOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    target_id: str
    mode: str
    status: str
    created_at: str
    completed_at: str | None = None
    duration_ms: int = 0
    metrics: ScanMetrics
    results: list[TestResultOut] = []
