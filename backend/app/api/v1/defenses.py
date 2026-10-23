from __future__ import annotations

from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.defense import DefenseConfiguration
from app.schemas.defense import DefenseOut, DefenseToggle

router = APIRouter(prefix="/defenses", tags=["Defenses"])


@router.get("", response_model=list[DefenseOut])
def list_defenses(db: Session = Depends(get_db)) -> list[DefenseOut]:
    defenses = db.scalars(select(DefenseConfiguration).order_by(DefenseConfiguration.id)).all()
    return [DefenseOut.model_validate(d) for d in defenses]


@router.patch("/{defense_id}", response_model=DefenseOut)
def update_defense(defense_id: str, payload: DefenseToggle, db: Session = Depends(get_db)) -> DefenseOut:
    defense = db.get(DefenseConfiguration, defense_id)
    if not defense:
        raise HTTPException(404, "Defense configuration control not found")

    defense.enabled = payload.enabled
    db.commit()
    db.refresh(defense)
    return DefenseOut.model_validate(defense)


@router.patch("", response_model=list[DefenseOut])
def bulk_update_defenses(payload: dict[str, bool], db: Session = Depends(get_db)) -> list[DefenseOut]:
    for d_id, enabled in payload.items():
        d = db.get(DefenseConfiguration, d_id)
        if d:
            d.enabled = enabled
    db.commit()
    return list_defenses(db)
