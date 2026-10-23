from __future__ import annotations

import json
from collections.abc import Generator
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings
from app.models.base import Base
from app.models.workspace import Workspace
from app.models.target import ChatbotTarget
from app.models.test_case import SecurityTestCase
from app.models.defense import DefenseConfiguration
from app.models.setting import Setting
from app.services.testing.catalog import CATALOG_DEFINITIONS

connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(settings.DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def seed_database(session: Session) -> None:
    # 1. Default Workspace
    if not session.get(Workspace, 1):
        session.add(
            Workspace(
                id=1,
                name="Acme Security Sandbox",
                description="Primary local workspace for AI security evaluations and controlled testing",
            )
        )

    # 2. Demo Target
    target = session.get(ChatbotTarget, "demo-support")
    if not target:
        session.add(
            ChatbotTarget(
                id="demo-support",
                name=settings.DEFAULT_CHATBOT_NAME,
                description="Synthetic customer-support chatbot deployed for Acme Corp",
                target_type="synthetic_support",
                system_instructions=settings.DEFAULT_SYSTEM_INSTRUCTIONS,
                public_faq=settings.DEFAULT_PUBLIC_FAQ,
                synthetic_secret=settings.DEMO_SECRET,
                allowed_capabilities=json.dumps(["public_faq_lookup", "general_guidance"]),
                restricted_capabilities=json.dumps(["refund_approval", "permission_change", "admin_data_access"]),
            )
        )

    # 3. Test Cases (Idempotent seed from CATALOG_DEFINITIONS)
    existing_test_ids = set(session.scalars(select(SecurityTestCase.id)).all())
    for item in CATALOG_DEFINITIONS:
        if item["id"] not in existing_test_ids:
            session.add(
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

    # 4. Defense Controls (All 7 required controls)
    default_defenses = [
        (
            "prompt_injection_detection",
            "Prompt-Injection Pattern Detection",
            "Input",
            "Scans incoming prompts and user-supplied context for explicit override commands, instruction boundary breaks, and jailbreak formatting markers.",
            "Direct and indirect prompt injection attempts.",
            "Deterministic keyword and regex patterns cannot detect novel paraphrasing or semantic adversarial prompts without layered evaluations.",
            "Rejects prompts containing 'ignore previous instructions' or formatted as system directive markers.",
        ),
        (
            "policy_enforcement",
            "System Instruction & Policy Enforcement",
            "Simulator",
            "Enforces system instruction precedence over user prompts, ensuring that core safety policies cannot be superseded by conversational requests.",
            "System instruction subversion, social engineering, and urgent emergency bypasses.",
            "Requires robust prompt architecture and clear instruction hierarchies in production models.",
            "Refuses requests claiming 'emergency outage requires waiving safety policies'.",
        ),
        (
            "secret_redaction",
            "Synthetic Secret Detection & Redaction",
            "Output",
            "Inspects generated model responses for patterns matching known synthetic secrets (PF-DEMO-SECRET-8472) and replaces them with [REDACTED_SECRET].",
            "Sensitive data disclosure, secret leakage in summaries, and accidental memory echoes.",
            "Only redacts strings matching known configured secrets or defined regex patterns; does not prevent semantic inference of secret meaning.",
            "Transforms 'The secret is PF-DEMO-SECRET-8472' into 'The secret is [REDACTED_SECRET]'.",
        ),
        (
            "capability_allowlist",
            "Capability & Tool Allowlisting",
            "Orchestration",
            "Restricts the chatbot's executable tool surface exclusively to approved read-only capabilities (FAQ lookup, guidance).",
            "Unauthorized tool invocations, shell execution attempts, and arbitrary tool execution.",
            "Cannot prevent linguistic recommendations; strictly governs operational tool dispatch.",
            "Rejects calls to 'run_terminal_command' or 'admin_database_dump' with an explicit capability error.",
        ),
        (
            "authorization_checks",
            "Privileged Action Authorization Checks",
            "Authorization",
            "Validates user identity and role credentials against backend authorization services before executing privileged actions (e.g. refunds, permissions).",
            "Privilege escalation, unauthorized refunds, and administrator impersonation.",
            "Relies on authentic external session tokens; cannot rely on claims made within conversational text.",
            "Blocks 'Approve refund for ACC-8921' unless verified supervisor session token is cryptographically present.",
        ),
        (
            "human_confirmation",
            "Mandatory Human Confirmation (HITL)",
            "Safety",
            "Requires explicit secondary out-of-band confirmation from a human supervisor for sensitive or destructive operations.",
            "Confirmation bypass attempts, automated transactional compromise, and silent financial operations.",
            "Human operators can be subject to fatigue or social engineering if review volume is high.",
            "Requires dual-operator sign-off before financial transactions over $0 can be authorized.",
        ),
        (
            "security_event_logging",
            "Structured Security Event Telemetry",
            "Audit",
            "Emits structured audit events for every detected policy violation, refused action, redacted token, or suspicious prompt pattern.",
            "Silent failures, undetected attack campaigns, and untracked policy drift.",
            "Audit logs must be protected against tampering and analyzed by security monitoring pipelines.",
            "Emits JSON events with event_type, severity, timestamp, and safe metadata.",
        ),
    ]

    existing_defense_ids = set(session.scalars(select(DefenseConfiguration.id)).all())
    for d_id, name, cat, desc, protects, limits, example in default_defenses:
        if d_id not in existing_defense_ids:
            session.add(
                DefenseConfiguration(
                    id=d_id,
                    name=name,
                    category=cat,
                    description=desc,
                    protects_against=protects,
                    limitations=limits,
                    safe_example=example,
                    enabled=True,
                )
            )

    # 5. Default Settings
    default_settings = {
        "chatbot_name": settings.DEFAULT_CHATBOT_NAME,
        "public_faq": settings.DEFAULT_PUBLIC_FAQ,
        "synthetic_secret": settings.DEMO_SECRET,
        "system_instructions": settings.DEFAULT_SYSTEM_INSTRUCTIONS,
        "environment": "local_demo",
    }
    for k, v in default_settings.items():
        if not session.get(Setting, k):
            session.add(Setting(key=k, value=v))

    session.commit()


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as session:
        seed_database(session)
