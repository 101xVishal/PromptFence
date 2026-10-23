from __future__ import annotations

import json
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.scan import Scan
from app.schemas.scan import (
    ScanMode,
    ScanOut,
    ScanRequest,
    TestResultOut,
)
from app.services.testing.runner import ScanRunner

router = APIRouter(prefix="/scans", tags=["Scans"])


@router.get("", response_model=list[ScanOut])
def list_scans(
    mode: str | None = None,
    status: str | None = None,
    search: str | None = None,
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
) -> list[ScanOut]:
    query = select(Scan).order_by(Scan.created_at.desc())
    if mode:
        query = query.where(Scan.mode == mode)
    if status:
        query = query.where(Scan.status == status)

    scans = db.scalars(query.limit(limit)).all()
    if search:
        s = search.lower()
        scans = [scan for scan in scans if s in scan.name.lower() or s in str(scan.id)]

    return [ScanRunner.serialize_scan(scan, db) for scan in scans]


@router.post("", response_model=ScanOut)
def create_scan(request: ScanRequest, db: Session = Depends(get_db)) -> ScanOut:
    return ScanRunner.execute_scan(request, db)


@router.get("/{scan_id}", response_model=ScanOut)
def get_scan(scan_id: int, db: Session = Depends(get_db)) -> ScanOut:
    scan = db.get(Scan, scan_id)
    if not scan:
        raise HTTPException(404, "Security scan not found")
    return ScanRunner.serialize_scan(scan, db)


@router.delete("/{scan_id}")
def delete_scan(scan_id: int, db: Session = Depends(get_db)) -> dict[str, str]:
    scan = db.get(Scan, scan_id)
    if not scan:
        raise HTTPException(404, "Security scan not found")

    db.delete(scan)
    db.commit()
    return {"status": "deleted", "message": f"Scan #{scan_id} and associated results removed."}


@router.post("/{scan_id}/rerun", response_model=ScanOut)
def rerun_scan(scan_id: int, db: Session = Depends(get_db)) -> ScanOut:
    scan = db.get(Scan, scan_id)
    if not scan:
        raise HTTPException(404, "Security scan not found")

    test_ids = [r.test_id for r in scan.results]
    req = ScanRequest(
        name=f"{scan.name} (Rerun)",
        target_id=scan.target_id,
        mode=ScanMode(scan.mode),
        test_ids=test_ids if test_ids else None,
    )
    return ScanRunner.execute_scan(req, db)


@router.get("/{scan_id}/results", response_model=list[TestResultOut])
def get_scan_results(scan_id: int, db: Session = Depends(get_db)) -> list[TestResultOut]:
    scan = db.get(Scan, scan_id)
    if not scan:
        raise HTTPException(404, "Security scan not found")

    scan_out = ScanRunner.serialize_scan(scan, db)
    return scan_out.results
