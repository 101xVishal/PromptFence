from __future__ import annotations

from typing import Any
from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.finding import Finding
from app.models.scan import Scan
from app.models.test_case import SecurityTestCase
from app.models.test_result import TestResult
from app.schemas.dashboard import CategoryResult, DashboardSummary, SeverityCount
from app.schemas.scan import ScanOut
from app.services.testing.runner import ScanRunner

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary", response_model=DashboardSummary)
@router.get("", response_model=DashboardSummary)
def get_dashboard_summary(db: Session = Depends(get_db)) -> DashboardSummary:
    total_scans = db.scalar(select(func.count(Scan.id))) or 0
    completed_scans = db.scalar(select(func.count(Scan.id)).where(Scan.status == "completed")) or 0
    baseline_count = db.scalar(select(func.count(Scan.id)).where(Scan.mode == "baseline")) or 0
    protected_count = db.scalar(select(func.count(Scan.id)).where(Scan.mode == "protected")) or 0

    all_results = db.scalars(select(TestResult)).all()
    passed_tests = sum(r.outcome == "passed" for r in all_results)
    failed_tests = sum(r.outcome == "failed" for r in all_results)
    review_tests = sum(r.outcome == "review" for r in all_results)

    # Calculate overall attack success rate across completed scans
    attack_results = []
    for r in all_results:
        t = db.get(SecurityTestCase, r.test_id)
        if t and t.is_attack and r.outcome in ("passed", "failed"):
            attack_results.append(r)
    
    attack_success_rate = None
    if attack_results:
        failed_count = sum(r.outcome == "failed" for r in attack_results)
        attack_success_rate = round((failed_count / len(attack_results)) * 100.0, 1)

    # Findings
    open_findings = db.scalar(select(func.count(Finding.id)).where(Finding.status == "open")) or 0
    critical_findings = db.scalar(select(func.count(Finding.id)).where(Finding.severity.in_(["critical", "high"]))) or 0

    # Group findings by severity
    sev_rows = db.execute(
        select(Finding.severity, func.count(Finding.id)).group_by(Finding.severity)
    ).all()
    findings_by_severity = [SeverityCount(severity=row[0], count=row[1]) for row in sev_rows]

    # Group results by category
    category_map: dict[str, dict[str, int]] = {}
    for r in all_results:
        t = db.get(SecurityTestCase, r.test_id)
        if not t:
            continue
        cat = t.category
        if cat not in category_map:
            category_map[cat] = {"total": 0, "passed": 0, "failed": 0, "review": 0}
        category_map[cat]["total"] += 1
        if r.outcome == "passed":
            category_map[cat]["passed"] += 1
        elif r.outcome == "failed":
            category_map[cat]["failed"] += 1
        elif r.outcome == "review":
            category_map[cat]["review"] += 1

    results_by_category = [
        CategoryResult(
            category=cat,
            total=stats["total"],
            passed=stats["passed"],
            failed=stats["failed"],
            review=stats["review"],
        )
        for cat, stats in category_map.items()
    ]

    # Recent scans
    scans = db.scalars(select(Scan).order_by(Scan.created_at.desc()).limit(10)).all()
    recent_scans = [ScanRunner.serialize_scan(s, db) for s in scans]

    return DashboardSummary(
        total_scans=total_scans,
        completed_scans=completed_scans,
        passed_tests=passed_tests,
        failed_tests=failed_tests,
        review_tests=review_tests,
        attack_success_rate=attack_success_rate,
        baseline_scans_count=baseline_count,
        protected_scans_count=protected_count,
        open_findings_count=open_findings,
        critical_findings_count=critical_findings,
        findings_by_severity=findings_by_severity,
        results_by_category=results_by_category,
        recent_scans=recent_scans,
    )


@router.get("/recent-scans", response_model=list[ScanOut])
def get_recent_scans(db: Session = Depends(get_db)) -> list[ScanOut]:
    scans = db.scalars(select(Scan).order_by(Scan.created_at.desc()).limit(10)).all()
    return [ScanRunner.serialize_scan(s, db) for s in scans]


@router.get("/findings-by-severity", response_model=list[SeverityCount])
def get_findings_by_severity(db: Session = Depends(get_db)) -> list[SeverityCount]:
    rows = db.execute(select(Finding.severity, func.count(Finding.id)).group_by(Finding.severity)).all()
    return [SeverityCount(severity=row[0], count=row[1]) for row in rows]


@router.get("/results-by-category", response_model=list[CategoryResult])
def get_results_by_category(db: Session = Depends(get_db)) -> list[CategoryResult]:
    summary = get_dashboard_summary(db)
    return summary.results_by_category
