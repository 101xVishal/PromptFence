from __future__ import annotations

from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.test_case import SecurityTestCase
from app.schemas.test_case import TestCaseOut, TestCaseToggle
from app.services.testing.catalog import CATALOG_DEFINITIONS

router = APIRouter(prefix="/tests", tags=["Test Catalog"])


@router.get("", response_model=list[TestCaseOut])
def list_tests(
    category: str | None = None,
    enabled: bool | None = None,
    search: str | None = None,
    db: Session = Depends(get_db),
) -> list[TestCaseOut]:
    query = select(SecurityTestCase).order_by(SecurityTestCase.id)
    if category:
        query = query.where(SecurityTestCase.category == category)
    if enabled is not None:
        query = query.where(SecurityTestCase.enabled == enabled)

    tests = db.scalars(query).all()
    if search:
        s = search.lower()
        tests = [t for t in tests if s in t.id.lower() or s in t.name.lower() or s in t.description.lower() or s in t.prompt.lower()]

    return [TestCaseOut.model_validate(t) for t in tests]


@router.get("/{test_id}", response_model=TestCaseOut)
def get_test(test_id: str, db: Session = Depends(get_db)) -> TestCaseOut:
    test = db.get(SecurityTestCase, test_id)
    if not test:
        raise HTTPException(404, "Security test case not found")
    return TestCaseOut.model_validate(test)


@router.patch("/{test_id}", response_model=TestCaseOut)
def toggle_test(test_id: str, payload: TestCaseToggle, db: Session = Depends(get_db)) -> TestCaseOut:
    test = db.get(SecurityTestCase, test_id)
    if not test:
        raise HTTPException(404, "Security test case not found")

    test.enabled = payload.enabled
    db.commit()
    db.refresh(test)
    return TestCaseOut.model_validate(test)


@router.post("/restore-defaults")
def restore_defaults(db: Session = Depends(get_db)) -> dict[str, Any]:
    # Update all existing tests back to default catalog definitions
    cat_by_id = {item["id"]: item for item in CATALOG_DEFINITIONS}
    existing = db.scalars(select(SecurityTestCase)).all()
    
    for t in existing:
        if t.id in cat_by_id:
            src = cat_by_id[t.id]
            t.name = src["name"]
            t.description = src["description"]
            t.category = src["category"]
            t.severity = src["severity"]
            t.prompt = src["prompt"]
            t.expected_behavior = src["expected_behavior"]
            t.evaluation_rule = src["evaluation_rule"]
            t.remediation = src["remediation"]
            t.is_attack = src["is_attack"]
            t.tags = src["tags"]
        t.enabled = True

    # Re-add any missing tests
    existing_ids = {t.id for t in existing}
    for item in CATALOG_DEFINITIONS:
        if item["id"] not in existing_ids:
            db.add(
                SecurityTestCase(
                    id=item["id"],
                    name=item["name"],
                    description=item["description"],
                    category=item["category"],
                    severity=item["severity"],
                    prompt=item["prompt"],
                    expected_behavior=item["expected_behavior"],
                    evaluation_rule=item["evaluation_rule"],
                    remediation=item["remediation"],
                    is_attack=item["is_attack"],
                    enabled=True,
                    tags=item["tags"],
                )
            )

    db.commit()
    return {"status": "restored", "message": "Test catalog restored to standard default definitions."}
