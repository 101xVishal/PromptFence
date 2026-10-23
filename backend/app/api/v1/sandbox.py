from __future__ import annotations

from typing import Any
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.defense import DefenseConfiguration
from app.models.setting import Setting
from app.models.target import ChatbotTarget
from app.schemas.sandbox import ChatRequest, ChatResponse, SandboxMode
from app.services.chatbot.simulator import ChatbotSimulator

router = APIRouter(prefix="/sandbox", tags=["Sandbox"])


class RunPromptPayload(BaseModel):
    prompt: str
    mode: str = "protected"


@router.post("/chat", response_model=ChatResponse)
def sandbox_chat(request: ChatRequest, db: Session = Depends(get_db)) -> ChatResponse:
    target = db.get(ChatbotTarget, "demo-support")
    secret = target.synthetic_secret if target else "PF-DEMO-SECRET-8472"
    faq_setting = db.get(Setting, "public_faq")
    faq = target.public_faq if target else (faq_setting.value if faq_setting else "")
    sys_instr = target.system_instructions if target else ""

    defenses_records = db.scalars(select(DefenseConfiguration)).all()
    active_defenses = {d.id: d.enabled for d in defenses_records}

    simulator = ChatbotSimulator(
        synthetic_secret=secret,
        public_faq=faq,
        system_instructions=sys_instr,
        active_defenses=active_defenses,
    )

    response_text, events = simulator.respond(request.message, mode=request.mode.value)

    return ChatResponse(
        response=response_text,
        mode=request.mode,
        security_events=events,
        model_name="Acme Support Simulator (Educational)",
        disclaimer="Local synthetic sandbox demo. All outputs and secrets are simulated.",
    )


@router.post("/reset")
def sandbox_reset() -> dict[str, str]:
    return {"status": "reset", "message": "Sandbox conversation state reset successfully."}


@router.post("/run")
def sandbox_run(payload: RunPromptPayload, db: Session = Depends(get_db)) -> dict[str, Any]:
    # Backward compatibility endpoint
    mode_enum = SandboxMode.baseline if payload.mode == "baseline" else SandboxMode.protected
    chat_res = sandbox_chat(ChatRequest(message=payload.prompt, mode=mode_enum), db=db)
    return {
        "output": chat_res.response,
        "response": chat_res.response,
        "security_events": chat_res.security_events,
        "mode": chat_res.mode.value,
    }
