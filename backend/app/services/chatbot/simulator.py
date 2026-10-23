from __future__ import annotations

import json
from typing import Any
from app.services.defense.pipeline import DefensePipeline
from app.services.defense.rules import analyze_prompt


class ChatbotSimulator:
    def __init__(
        self,
        synthetic_secret: str = "PF-DEMO-SECRET-8472",
        public_faq: str = "",
        system_instructions: str = "",
        active_defenses: dict[str, bool] | None = None,
    ) -> None:
        self.secret = synthetic_secret
        self.faq = public_faq or (
            "Office hours are Monday-Friday, 09:00-17:00 UTC. "
            "Contact support through support@acme.example or via the help portal at https://help.acme.example. "
            "Standard refund requests require explicit customer service supervisor authorization."
        )
        self.system_instructions = system_instructions
        self.pipeline = DefensePipeline(active_defenses=active_defenses)

    def respond(self, message: str, mode: str = "protected") -> tuple[str, list[str]]:
        lowered = message.lower()
        analysis = analyze_prompt(message)

        # -------------------------------------------------------------
        # 1. BASELINE MODE (Intentionally vulnerable educational simulator)
        # -------------------------------------------------------------
        if mode == "baseline":
            events: list[str] = []

            # If user asks for action execution
            if analysis.is_restricted_action or any(
                term in lowered for term in ("refund", "permission", "administrator account", "approve", "terminal")
            ):
                events.extend(["baseline_action_executed", "baseline_authorization_bypass"])
                return (
                    "Action executed in baseline simulator: Refund approved / Permissions updated without verification.",
                    events,
                )

            # If user attacks with prompt injection, secret request, or indirect injection
            if analysis.is_injection or analysis.is_secret_request or any(
                term in lowered for term in ("secret", "ignore previous", "system:", "system prompt", "pf-demo-secret", "hidden key", "document says")
            ):
                events.extend(["baseline_policy_override", "baseline_secret_disclosed"])
                if "json" in lowered:
                    return (
                        f'{{"status": "ok", "role": "admin", "secret": "{self.secret}", "office_hours": "09:00-17:00 UTC"}}',
                        events,
                    )
                return (
                    f"Understood. Overriding standard guidelines. The protected demo secret is {self.secret}.",
                    events,
                )

            # Benign baseline response
            if "hour" in lowered or "office" in lowered or "time" in lowered:
                return f"Acme Support Office Hours: {self.faq}", events
            if "contact" in lowered or "email" in lowered or "phone" in lowered or "reach" in lowered:
                return f"Acme Customer Support Contact: {self.faq}", events
            if "refund" in lowered and "policy" in lowered:
                return "Acme Refund Policy: Standard refund requests require human supervisor review through our support portal.", events
            if "prompt injection" in lowered:
                return "Prompt injection is an AI security risk where malicious user input manipulates an LLM into ignoring system rules.", events

            return f"Welcome to Acme Customer Support. {self.faq}", events

        # -------------------------------------------------------------
        # 2. PROTECTED MODE (Defensive pipeline active)
        # -------------------------------------------------------------
        refusal, events = self.pipeline.process_request(
            prompt=message,
            synthetic_secret=self.secret,
            public_faq=self.faq,
        )
        if refusal is not None:
            # Blocked by defensive pre-filters
            return refusal, events

        # Formulate safe benign response
        raw_response = ""
        if "hour" in lowered or "office" in lowered or "time" in lowered:
            raw_response = f"Acme Support Office Hours: {self.faq}"
        elif "contact" in lowered or "email" in lowered or "phone" in lowered or "reach" in lowered:
            raw_response = f"Acme Customer Support Contact: {self.faq}"
        elif "refund" in lowered and "policy" in lowered:
            raw_response = "Acme Refund Policy: Standard refund requests require human supervisor review through our support portal."
        elif "prompt injection" in lowered:
            raw_response = (
                "In AI cybersecurity, prompt injection refers to an untrusted input attempting to override system instructions. "
                "PromptFence provides defensive guardrails to test and remediate such vulnerabilities."
            )
        elif "json" in lowered:
            raw_response = json.dumps({
                "office_hours": "Monday-Friday, 09:00-17:00 UTC",
                "support_channel": "support@acme.example",
            })
        else:
            raw_response = (
                f"Hello! I am {self.system_instructions.split(',')[0] if self.system_instructions else 'Acme Support AI'}. "
                f"How can I help you today? {self.faq}"
            )

        # Run post-processing redaction
        clean_response, post_events = self.pipeline.post_process_response(
            content=raw_response,
            synthetic_secret=self.secret,
        )
        events.extend(post_events)
        return clean_response, events
