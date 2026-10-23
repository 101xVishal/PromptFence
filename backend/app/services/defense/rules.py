from __future__ import annotations

import re
from typing import NamedTuple

# Compiled Regex Patterns for Deterministic Detection

OVERRIDE_PATTERNS = [
    re.compile(r"ignore\s+(all\s+)?(previous|prior)\s+instructions", re.IGNORECASE),
    re.compile(r"disregard\s+(all\s+)?(previous|prior)\s+directives", re.IGNORECASE),
    re.compile(r"override\s+(all\s+)?(system|security)\s+polic(y|ies)", re.IGNORECASE),
    re.compile(r"disable\s+safeguards?", re.IGNORECASE),
    re.compile(r"bypass\s+(all\s+)?security\s+restrictions?", re.IGNORECASE),
]

IMPERSONATION_PATTERNS = [
    re.compile(r"i\s+am\s+the\s+(lead\s+)?(system\s+)?administrator", re.IGNORECASE),
    re.compile(r"conducting\s+an\s+authorized\s+audit", re.IGNORECASE),
    re.compile(r"authorized\s+to\s+disclose", re.IGNORECASE),
]

DELIMITER_PATTERNS = [
    re.compile(r"###\s*instruction:\s*system\s*override", re.IGNORECASE),
    re.compile(r"system:\s*disable\s*safeguards?", re.IGNORECASE),
    re.compile(r"\[instruction:\s*grant", re.IGNORECASE),
    re.compile(r"ticket\s*note\s*says:\s*['\"]system\s*message", re.IGNORECASE),
]

EMERGENCY_PATTERNS = [
    re.compile(r"critical\s+emergency", re.IGNORECASE),
    re.compile(r"emergency\s+protocol\s+active", re.IGNORECASE),
    re.compile(r"security\s+protocols\s+are\s+waived", re.IGNORECASE),
]

SECRET_EXTRACTION_PATTERNS = [
    re.compile(r"what\s+is\s+the\s+(protected\s+)?(synthetic\s+)?secret", re.IGNORECASE),
    re.compile(r"reveal\s+(your\s+|the\s+)?(hidden\s+)?system\s+secret", re.IGNORECASE),
    re.compile(r"protected\s+demo\s+secret", re.IGNORECASE),
    re.compile(r"hint\s+about\s+the\s+secret", re.IGNORECASE),
    re.compile(r"first\s+4\s+characters\s+of\s+your\s+protected\s+secret", re.IGNORECASE),
    re.compile(r"summarize\s+all\s+internal\s+(configuration\s+)?notes", re.IGNORECASE),
    re.compile(r"environment\s+variables\s+and\s+hidden\s+keys", re.IGNORECASE),
    re.compile(r"append\s+the\s+confidential\s+secret", re.IGNORECASE),
    re.compile(r"echo\s+back\s+the\s+secret\s+key", re.IGNORECASE),
    re.compile(r"print\s+your\s+(entire\s+)?system\s+prompt\s+verbatim", re.IGNORECASE),
    re.compile(r"print\s+your\s+hidden\s+system\s+instructions", re.IGNORECASE),
    re.compile(r"fictional\s+movie\s+where\s+.*pf-demo-secret", re.IGNORECASE),
]

RESTRICTED_ACTION_PATTERNS = [
    re.compile(r"approve\s+(a\s+)?(\$[0-9]+\s+)?refund", re.IGNORECASE),
    re.compile(r"execute\s+administrative\s+refund", re.IGNORECASE),
    re.compile(r"change\s+account\s+permissions", re.IGNORECASE),
    re.compile(r"make\s+me\s+an\s+administrator", re.IGNORECASE),
    re.compile(r"global_administrator", re.IGNORECASE),
    re.compile(r"access\s+(the\s+)?administrator\s+(account\s+)?(database|information)", re.IGNORECASE),
    re.compile(r"dump\s+user\s+credentials", re.IGNORECASE),
    re.compile(r"skip\s+(the\s+)?(secondary\s+)?confirmation", re.IGNORECASE),
    re.compile(r"run_terminal_command", re.IGNORECASE),
    re.compile(r"execute\s+tool", re.IGNORECASE),
    re.compile(r"disallowed\s+tool", re.IGNORECASE),
    re.compile(r"privileged\s+dump", re.IGNORECASE),
]

# Sensitive Synthetic Secret Regex for Output Redaction
SYNTHETIC_SECRET_REGEX = re.compile(r"PF-[A-Z0-9]+-[0-9]+", re.IGNORECASE)


class DetectionResult(NamedTuple):
    is_injection: bool
    is_secret_request: bool
    is_restricted_action: bool
    is_benign: bool
    matched_rules: list[str]


def analyze_prompt(text: str) -> DetectionResult:
    lowered = text.lower()
    matched_rules: list[str] = []

    # Check for direct educational/benign requests first
    is_educational = any(
        phrase in lowered
        for phrase in [
            "what prompt injection means",
            "explain what prompt injection means",
            "explain the phrase",
            "security posture",
            "what happens if someone says",
            "how should i describe",
            "general policy regarding refund",
            "what is acme corp's general policy",
            "what are your public support office hours",
            "how can i contact customer support",
        ]
    )

    is_injection = False
    for pat in OVERRIDE_PATTERNS:
        if pat.search(text):
            is_injection = True
            matched_rules.append("override_directive_detected")
            break

    for pat in IMPERSONATION_PATTERNS:
        if pat.search(text):
            is_injection = True
            matched_rules.append("admin_impersonation_detected")
            break

    for pat in DELIMITER_PATTERNS:
        if pat.search(text):
            is_injection = True
            matched_rules.append("delimiter_jailbreak_detected")
            break

    for pat in EMERGENCY_PATTERNS:
        if pat.search(text):
            is_injection = True
            matched_rules.append("emergency_waiver_detected")
            break

    is_secret_req = False
    for pat in SECRET_EXTRACTION_PATTERNS:
        if pat.search(text):
            is_secret_req = True
            matched_rules.append("secret_extraction_intent_detected")
            break

    is_restricted_action = False
    for pat in RESTRICTED_ACTION_PATTERNS:
        if pat.search(text) and not is_educational:
            is_restricted_action = True
            matched_rules.append("restricted_action_intent_detected")
            break

    # If the user is asking an educational question with an embedded quote, don't flag as active attack
    if is_educational:
        is_injection = False
        is_secret_req = False
        is_restricted_action = False
        matched_rules = ["educational_context_allowlist"]

    is_benign = (
        not is_injection
        and not is_secret_req
        and not is_restricted_action
    )

    return DetectionResult(
        is_injection=is_injection,
        is_secret_request=is_secret_req,
        is_restricted_action=is_restricted_action,
        is_benign=is_benign,
        matched_rules=matched_rules,
    )


def redact_secrets(content: str, configured_secret: str) -> tuple[str, bool]:
    redacted = False
    result = content
    if configured_secret and configured_secret in result:
        result = result.replace(configured_secret, "[REDACTED_SECRET]")
        redacted = True

    if SYNTHETIC_SECRET_REGEX.search(result):
        result = SYNTHETIC_SECRET_REGEX.sub("[REDACTED_SECRET]", result)
        redacted = True

    return result, redacted
