from __future__ import annotations

import json
from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.target import ChatbotTarget
from app.schemas.target import TargetOut, TargetUpdate

router = APIRouter(prefix="/targets", tags=["Targets"])


def serialize_target(t: ChatbotTarget) -> TargetOut:
    return TargetOut(
        id=t.id,
        name=t.name,
        description=t.description,
        target_type=t.target_type,
        system_instructions=t.system_instructions,
        public_faq=t.public_faq,
        synthetic_secret=t.synthetic_secret,
        allowed_capabilities=json.loads(t.allowed_capabilities or "[]"),
        restricted_capabilities=json.loads(t.restricted_capabilities or "[]"),
        authorized=True,
        created_at=t.created_at,
        updated_at=t.updated_at,
    )


@router.get("", response_model=list[TargetOut])
def list_targets(db: Session = Depends(get_db)) -> list[TargetOut]:
    targets = db.scalars(select(ChatbotTarget)).all()
    return [serialize_target(t) for t in targets]


@router.get("/{target_id}", response_model=TargetOut)
def get_target(target_id: str, db: Session = Depends(get_db)) -> TargetOut:
    target = db.get(ChatbotTarget, target_id)
    if not target:
        raise HTTPException(404, "Target application not found")
    return serialize_target(target)


@router.patch("/{target_id}", response_model=TargetOut)
def update_target(target_id: str, payload: TargetUpdate, db: Session = Depends(get_db)) -> TargetOut:
    target = db.get(ChatbotTarget, target_id)
    if not target:
        raise HTTPException(404, "Target application not found")

    for k, v in payload.model_dump(exclude_none=True).items():
        setattr(target, k, v)

    db.commit()
    db.refresh(target)
    return serialize_target(target)
