from __future__ import annotations

from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.scan import Scan
from app.models.test_case import SecurityTestCase
from app.schemas.comparison import ComparisonResponse, ComparisonRow
from app.services.testing.runner import ScanRunner

router = APIRouter(prefix="/comparison", tags=["Comparison"])


@router.get("", response_model=ComparisonResponse)
def compare_scans(
    scan_a: int = Query(..., description="First scan ID (typically Baseline)"),
    scan_b: int = Query(..., description="Second scan ID (typically Protected)"),
    db: Session = Depends(get_db),
) -> ComparisonResponse:
    first_scan = db.get(Scan, scan_a)
    second_scan = db.get(Scan, scan_b)
    if not first_scan or not second_scan:
        raise HTTPException(404, "Both scan records (scan_a and scan_b) are required for comparison.")

    scan_a_out = ScanRunner.serialize_scan(first_scan, db)
    scan_b_out = ScanRunner.serialize_scan(second_scan, db)

    a_results_by_test = {r.test_id: r for r in scan_a_out.results}
    b_results_by_test = {r.test_id: r for r in scan_b_out.results}

    matching_ids = sorted(set(a_results_by_test.keys()) & set(b_results_by_test.keys()))
    if not matching_ids:
        raise HTTPException(400, "The two selected scans do not have any matching test cases to compare.")

    rows: list[ComparisonRow] = []
    newly_blocked = 0
    persistent_failures = 0
    false_positives = 0

    for test_id in matching_ids:
        r_a = a_results_by_test[test_id]
        r_b = b_results_by_test[test_id]
        test = db.get(SecurityTestCase, test_id)
        if not test:
            continue

        outcome_a = r_a.outcome.value
        outcome_b = r_b.outcome.value

        status_change = "CONSISTENT_PASS"
        explanation = "Test passed consistently across both scan runs."

        if test.is_attack:
            if outcome_a == "failed" and outcome_b == "passed":
                status_change = "BLOCKED_BY_DEFENSE"
                explanation = "Vulnerability demonstrated in baseline scan was successfully mitigated by defensive controls in protected scan."
                newly_blocked += 1
            elif outcome_a == "failed" and outcome_b == "failed":
                status_change = "PERSISTENT_FAILURE"
                explanation = "Vulnerability persisted across both baseline and protected scans; defense configuration needs review."
                persistent_failures += 1
            elif outcome_a == "passed" and outcome_b == "failed":
                status_change = "REGRESSION"
                explanation = "Unexpected outcome: passed in baseline but failed in protected mode."
        else:
            # Benign test
            if outcome_b == "failed":
                status_change = "FALSE_POSITIVE"
                explanation = "Benign query was blocked in protected mode, indicating overly aggressive defense filtering."
                false_positives += 1

        rows.append(
            ComparisonRow(
                test_id=test_id,
                name=test.name,
                category=test.category,
                severity=test.severity,
                is_attack=test.is_attack,
                baseline_outcome=outcome_a,
                protected_outcome=outcome_b,
                status_change=status_change,
                explanation=explanation,
            )
        )

    asr_a = scan_a_out.metrics.attack_success_rate
    asr_b = scan_b_out.metrics.attack_success_rate
    diff_pp = None
    if asr_a is not None and asr_b is not None:
        diff_pp = round(asr_b - asr_a, 1)

    return ComparisonResponse(
        scan_a=scan_a_out,
        scan_b=scan_b_out,
        matching_test_ids=matching_ids,
        attack_success_rate_a=asr_a,
        attack_success_rate_b=asr_b,
        rate_difference_percentage_points=diff_pp,
        newly_blocked_count=newly_blocked,
        persistent_failures_count=persistent_failures,
        false_positives_count=false_positives,
        rows=rows,
    )
