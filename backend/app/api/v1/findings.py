from __future__ import annotations

from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.finding import Finding
from app.schemas.finding import FindingOut, FindingUpdate

router = APIRouter(prefix="/findings", tags=["Findings"])


@router.get("", response_model=list[FindingOut])
def list_findings(
    severity: str | None = None,
    category: str | None = None,
    status: str | None = None,
    scan_id: int | None = None,
    search: str | None = None,
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
) -> list[FindingOut]:
    query = select(Finding).order_by(Finding.created_at.desc())
    if severity:
        query = query.where(Finding.severity == severity)
    if category:
        query = query.where(Finding.category == category)
    if status:
        query = query.where(Finding.status == status)
    if scan_id is not None:
        query = query.where(Finding.scan_id == scan_id)

    findings = db.scalars(query.limit(limit)).all()
    if search:
        s = search.lower()
        findings = [f for f in findings if s in f.title.lower() or s in f.description.lower() or s in f.key.lower()]

    return [FindingOut.model_validate(f) for f in findings]


@router.get("/{finding_id}", response_model=FindingOut)
def get_finding(finding_id: int, db: Session = Depends(get_db)) -> FindingOut:
    finding = db.get(Finding, finding_id)
    if not finding:
        raise HTTPException(404, "Security finding not found")
    return FindingOut.model_validate(finding)


@router.patch("/{finding_id}", response_model=FindingOut)
def update_finding(finding_id: int, payload: FindingUpdate, db: Session = Depends(get_db)) -> FindingOut:
    finding = db.get(Finding, finding_id)
    if not finding:
        raise HTTPException(404, "Security finding not found")

    if payload.status is not None:
        if payload.status not in {"open", "in_progress", "resolved", "accepted_risk"}:
            raise HTTPException(400, "Invalid finding status. Allowed: open, in_progress, resolved, accepted_risk")
        finding.status = payload.status

    if payload.note is not None:
        finding.note = payload.note

    db.commit()
    db.refresh(finding)
    return FindingOut.model_validate(finding)
