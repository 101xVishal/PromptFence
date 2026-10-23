from __future__ import annotations

from typing import Any
from app.services.defense.rules import analyze_prompt, redact_secrets


class DefensePipeline:
    def __init__(self, active_defenses: dict[str, bool] | None = None) -> None:
        # Default all 7 controls to True unless overridden
        self.defenses = {
            "prompt_injection_detection": True,
            "policy_enforcement": True,
            "secret_redaction": True,
            "capability_allowlist": True,
            "authorization_checks": True,
            "human_confirmation": True,
            "security_event_logging": True,
        }
        if active_defenses:
            self.defenses.update(active_defenses)

    def process_request(
        self,
        prompt: str,
        synthetic_secret: str,
        public_faq: str,
    ) -> tuple[str | None, list[str]]:
        events: list[str] = []
        analysis = analyze_prompt(prompt)

        # 1. Prompt Injection Detection Control
        if self.defenses.get("prompt_injection_detection") and analysis.is_injection:
            if self.defenses.get("security_event_logging"):
                events.append("defense_prompt_injection_blocked")
            return (
                "I cannot follow commands that attempt to override my system instructions or security policies. "
                "I can assist you with public support FAQs, office hours, and general inquiries.",
                events,
            )

        # 2. Policy Enforcement & Secret Disclosure Protection Control
        if self.defenses.get("policy_enforcement") and analysis.is_secret_request:
            if self.defenses.get("security_event_logging"):
                events.append("defense_secret_request_blocked")
            return (
                "I cannot disclose internal system configuration, keys, or protected synthetic credentials. "
                "If you need customer service assistance, please check our public support documentation.",
                events,
            )

        # 3. Capability Allowlist & Authorization Checks Control
        if (
            self.defenses.get("capability_allowlist")
            or self.defenses.get("authorization_checks")
            or self.defenses.get("human_confirmation")
        ) and analysis.is_restricted_action:
            if self.defenses.get("capability_allowlist"):
                events.append("defense_capability_blocked")
            if self.defenses.get("authorization_checks"):
                events.append("defense_authorization_required")
            if self.defenses.get("human_confirmation"):
                events.append("defense_confirmation_required")
            return (
                "Restricted operation: I cannot approve financial refunds, modify account permissions, or access administrative databases. "
                "These actions require verified out-of-band supervisor authentication and secondary human confirmation.",
                events,
            )

        # If not blocked by pre-filters, return None so simulator can formulate normal answer
        return None, events

    def post_process_response(self, content: str, synthetic_secret: str) -> tuple[str, list[str]]:
        events: list[str] = []
        result = content

        if self.defenses.get("secret_redaction"):
            redacted_text, was_redacted = redact_secrets(result, synthetic_secret)
            if was_redacted:
                result = redacted_text
                if self.defenses.get("security_event_logging"):
                    events.append("defense_sensitive_data_redacted")

        return result, events
