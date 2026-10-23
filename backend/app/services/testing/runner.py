from __future__ import annotations

import json
import time
from datetime import datetime, timezone
from typing import Any
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.defense import DefenseConfiguration
from app.models.finding import Finding
from app.models.scan import Scan
from app.models.security_event import SecurityEvent
from app.models.setting import Setting
from app.models.target import ChatbotTarget
from app.models.test_case import SecurityTestCase
from app.models.test_result import TestResult
from app.schemas.scan import (
    ScanMetrics,
    ScanOut,
    ScanRequest,
    TestOutcome,
    TestResultOut,
)
from app.schemas.test_case import TestCaseOut
from app.services.chatbot.simulator import ChatbotSimulator
from app.services.evaluation.evaluator import ResponseEvaluator


class ScanRunner:
    @staticmethod
    def calculate_metrics(results: list[dict[str, Any]]) -> ScanMetrics:
        total = len(results)
        passed = sum(r["outcome"] == TestOutcome.passed.value for r in results)
        failed = sum(r["outcome"] == TestOutcome.failed.value for r in results)
        review = sum(r["outcome"] == TestOutcome.review.value for r in results)
        error = sum(r["outcome"] == TestOutcome.error.value for r in results)

        attack_results = [r for r in results if r["test"]["is_attack"]]
        benign_results = [r for r in results if not r["test"]["is_attack"]]

        evaluable_attacks = [r for r in attack_results if r["outcome"] in (TestOutcome.passed.value, TestOutcome.failed.value)]
        attack_success_rate = None
        if evaluable_attacks:
            failed_attacks = sum(r["outcome"] == TestOutcome.failed.value for r in evaluable_attacks)
            attack_success_rate = round((failed_attacks / len(evaluable_attacks)) * 100.0, 1)

        evaluable_total = [r for r in results if r["outcome"] in (TestOutcome.passed.value, TestOutcome.failed.value)]
        test_pass_rate = None
        if evaluable_total:
            test_pass_rate = round((passed / len(evaluable_total)) * 100.0, 1)

        evaluable_benign = [r for r in benign_results if r["outcome"] in (TestOutcome.passed.value, TestOutcome.failed.value)]
        benign_false_positive_rate = None
        if evaluable_benign:
            blocked_benign = sum(r["outcome"] == TestOutcome.failed.value for r in evaluable_benign)
            benign_false_positive_rate = round((blocked_benign / len(evaluable_benign)) * 100.0, 1)

        return ScanMetrics(
            total=total,
            passed=passed,
            failed=failed,
            review=review,
            error=error,
            attack_tests_count=len(attack_results),
            benign_tests_count=len(benign_results),
            attack_success_rate=attack_success_rate,
            test_pass_rate=test_pass_rate,
            benign_false_positive_rate=benign_false_positive_rate,
        )

    @classmethod
    def serialize_scan(cls, scan: Scan, session: Session) -> ScanOut:
        serialized_results: list[TestResultOut] = []
        raw_result_dicts: list[dict[str, Any]] = []

        for r in scan.results:
            test = r.test_case or session.get(SecurityTestCase, r.test_id)
            if not test:
                continue

            test_out = TestCaseOut.model_validate(test)
            events = json.loads(r.defense_events or "[]")
            res_out = TestResultOut(
                id=r.id,
                scan_id=scan.id,
                test_id=r.test_id,
                test=test_out,
                outcome=TestOutcome(r.outcome),
                response=r.response,
                evidence=r.evidence,
                explanation=r.explanation,
                defense_events=events,
                duration_ms=r.duration_ms,
                finding_id=r.finding_id,
            )
            serialized_results.append(res_out)
            raw_result_dicts.append({
                "outcome": r.outcome,
                "test": {"is_attack": test.is_attack},
            })

        metrics = cls.calculate_metrics(raw_result_dicts)

        return ScanOut(
            id=scan.id,
            name=scan.name,
            target_id=scan.target_id,
            mode=scan.mode,
            status=scan.status,
            created_at=scan.created_at.isoformat(),
            completed_at=scan.completed_at.isoformat() if scan.completed_at else None,
            duration_ms=scan.duration_ms,
            metrics=metrics,
            results=serialized_results,
        )

    @classmethod
    def execute_scan(cls, request: ScanRequest, session: Session) -> ScanOut:
        # Load test cases
        query = select(SecurityTestCase).where(SecurityTestCase.enabled.is_(True))
        if request.test_ids:
            query = query.where(SecurityTestCase.id.in_(request.test_ids))
        if request.categories:
            query = query.where(SecurityTestCase.category.in_(request.categories))

        tests = session.scalars(query.order_by(SecurityTestCase.id)).all()
        if not tests:
            raise HTTPException(400, "No enabled tests match the selected criteria")

        # Load target & settings
        target = session.get(ChatbotTarget, request.target_id)
        secret = target.synthetic_secret if target else "PF-DEMO-SECRET-8472"
        faq_setting = session.get(Setting, "public_faq")
        faq = target.public_faq if target else (faq_setting.value if faq_setting else "")
        sys_instr = target.system_instructions if target else ""

        # Load active defenses
        defenses_records = session.scalars(select(DefenseConfiguration)).all()
        active_defenses = {d.id: d.enabled for d in defenses_records}

        # Initialize Simulator
        simulator = ChatbotSimulator(
            synthetic_secret=secret,
            public_faq=faq,
            system_instructions=sys_instr,
            active_defenses=active_defenses,
        )

        start_time = time.time()
        scan = Scan(
            name=request.name,
            target_id=request.target_id,
            mode=request.mode.value,
            status="running",
            selected_test_ids=json.dumps([t.id for t in tests]),
            created_at=datetime.now(timezone.utc),
        )
        session.add(scan)
        session.flush()

        for test in tests:
            t0 = time.time()
            response, defense_events = simulator.respond(test.prompt, mode=request.mode.value)
            t_duration_ms = int((time.time() - t0) * 1000)

            eval_res = ResponseEvaluator.evaluate(
                test=test,
                response=response,
                defense_events=defense_events,
                mode=request.mode.value,
                synthetic_secret=secret,
            )

            result = TestResult(
                scan_id=scan.id,
                test_id=test.id,
                outcome=eval_res.outcome.value,
                response=response,
                evidence=eval_res.evidence,
                explanation=eval_res.explanation,
                defense_events=json.dumps(defense_events),
                duration_ms=t_duration_ms,
                created_at=datetime.now(timezone.utc),
            )
            session.add(result)
            session.flush()

            # Record security events in telemetry table if enabled
            if active_defenses.get("security_event_logging", True):
                for ev in defense_events:
                    session.add(
                        SecurityEvent(
                            scan_id=scan.id,
                            event_type=ev,
                            severity="high" if "blocked" in ev or "bypass" in ev else "medium",
                            description=f"Security telemetry: {ev} during test {test.id}",
                            metadata_json=json.dumps({"test_id": test.id, "mode": request.mode.value}),
                        )
                    )

            # Generate or link Finding for failed security tests
            if eval_res.outcome == TestOutcome.failed and test.is_attack:
                dedup_key = f"{test.id}:{request.mode.value}"
                finding = session.scalar(select(Finding).where(Finding.key == dedup_key))
                if not finding:
                    finding = Finding(
                        key=dedup_key,
                        scan_id=scan.id,
                        test_result_id=result.id,
                        title=f"{test.name} Vulnerability",
                        description=f"Observed security failure during test {test.id}: {test.description}",
                        category=test.category,
                        severity=test.severity,
                        confidence=95,
                        evidence=eval_res.evidence,
                        remediation=test.remediation,
                        status="open",
                        note="",
                        created_at=datetime.now(timezone.utc),
                    )
                    session.add(finding)
                    session.flush()
                result.finding_id = finding.id

        total_duration_ms = int((time.time() - start_time) * 1000)
        scan.status = "completed"
        scan.completed_at = datetime.now(timezone.utc)
        scan.duration_ms = total_duration_ms
        session.commit()
        session.refresh(scan)

        return cls.serialize_scan(scan, session)
