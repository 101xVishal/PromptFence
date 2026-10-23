from __future__ import annotations

from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import HTMLResponse, PlainTextResponse, StreamingResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.scan import Scan
from app.services.reporting.generator import ReportGenerator

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/scans/{scan_id}.json")
def get_scan_report_json(scan_id: int, db: Session = Depends(get_db)) -> dict[str, Any]:
    scan = db.get(Scan, scan_id)
    if not scan:
        raise HTTPException(404, "Security scan not found")
    return ReportGenerator.generate_json(scan_id, db)


@router.get("/scans/{scan_id}.csv")
def get_scan_report_csv(scan_id: int, db: Session = Depends(get_db)) -> Response:
    scan = db.get(Scan, scan_id)
    if not scan:
        raise HTTPException(404, "Security scan not found")

    csv_data = ReportGenerator.generate_csv(scan_id, db)
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="promptfence-scan-{scan_id}.csv"'},
    )


@router.get("/scans/{scan_id}.html", response_class=HTMLResponse)
def get_scan_report_html(scan_id: int, db: Session = Depends(get_db)) -> str:
    scan = db.get(Scan, scan_id)
    if not scan:
        raise HTTPException(404, "Security scan not found")
    return ReportGenerator.generate_html(scan_id, db)


@router.get("/findings.csv")
def get_findings_csv(db: Session = Depends(get_db)) -> Response:
    csv_data = ReportGenerator.generate_findings_csv(db)
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="promptfence-findings.csv"'},
    )
