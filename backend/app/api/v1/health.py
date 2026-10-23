from __future__ import annotations

from typing import Any
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.test_case import SecurityTestCase

router = APIRouter(tags=["Health"])


@router.get("/health")
def health(db: Session = Depends(get_db)) -> dict[str, Any]:
    # Verify DB connectivity
    db.execute(select(SecurityTestCase).limit(1))
    return {
        "status": "ok",
        "database": "connected",
        "project": "PromptFence",
        "version": "1.0.0",
        "environment": "local_demo",
    }
