from __future__ import annotations

from typing import Any
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.finding import Finding
from app.models.scan import Scan
from app.models.security_event import SecurityEvent
from app.models.setting import Setting
from app.models.target import ChatbotTarget
from app.models.test_result import TestResult
from app.schemas.setting import SettingsOut, SettingsUpdate

router = APIRouter(prefix="/settings", tags=["Settings"])


@router.get("", response_model=dict[str, str])
def get_settings(db: Session = Depends(get_db)) -> dict[str, str]:
    items = db.scalars(select(Setting)).all()
    return {s.key: s.value for s in items}


@router.patch("", response_model=dict[str, str])
def update_settings(payload: SettingsUpdate, db: Session = Depends(get_db)) -> dict[str, str]:
    updates = payload.model_dump(exclude_none=True)
    target = db.get(ChatbotTarget, "demo-support")

    for k, v in updates.items():
        s = db.get(Setting, k)
        if s:
            s.value = v
        else:
            db.add(Setting(key=k, value=v))

        # Also sync target if applicable
        if target:
            if k == "chatbot_name":
                target.name = v
            elif k == "public_faq":
                target.public_faq = v
            elif k == "synthetic_secret":
                target.synthetic_secret = v
            elif k == "system_instructions":
                target.system_instructions = v

    db.commit()
    return get_settings(db)


@router.post("/reset-demo")
def reset_demo(db: Session = Depends(get_db)) -> dict[str, str]:
    db.query(SecurityEvent).delete()
    db.query(TestResult).delete()
    db.query(Finding).delete()
    db.query(Scan).delete()
    db.commit()
    return {
        "status": "reset",
        "message": "Demo scans, test results, findings, and security telemetry cleared successfully.",
    }
