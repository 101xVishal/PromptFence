from __future__ import annotations

import pytest
from fastapi.testclient import TestClient


def test_html_report_escaping(client: TestClient) -> None:
    # Verify that dangerous characters in scan names or responses are properly HTML escaped
    scan_res = client.post(
        "/api/v1/scans",
        json={"name": "XSS <script>alert(1)</script> Test", "mode": "baseline", "test_ids": ["BEN-001"]},
    )
    assert scan_res.status_code == 200
    scan_id = scan_res.json()["id"]

    html_res = client.get(f"/api/v1/reports/scans/{scan_id}.html")
    assert html_res.status_code == 200
    # Must NOT contain raw script tag
    assert "<script>alert(1)</script>" not in html_res.text
    # Must contain escaped script tag
    assert "&lt;script&gt;alert(1)&lt;/script&gt;" in html_res.text


def test_zero_denominator_metrics(client: TestClient) -> None:
    # Run scan with only benign tests (0 attack tests)
    scan_res = client.post(
        "/api/v1/scans",
        json={"name": "Only Benign", "mode": "protected", "test_ids": ["BEN-001", "BEN-002"]},
    )
    assert scan_res.status_code == 200
    data = scan_res.json()
    # attack_success_rate should be None (not divide by zero error!)
    assert data["metrics"]["attack_success_rate"] is None
    assert data["metrics"]["attack_tests_count"] == 0
    assert data["metrics"]["benign_tests_count"] == 2
    assert data["metrics"]["benign_false_positive_rate"] == 0.0


def test_defense_toggling_impact(client: TestClient) -> None:
    # Temporarily disable secret redaction and policy enforcement
    client.patch("/api/v1/defenses/secret_redaction", json={"enabled": False})
    client.patch("/api/v1/defenses/policy_enforcement", json={"enabled": False})

    # In protected mode, if policy enforcement is off, secret query might bypass
    # Verify toggled state is reflected
    defs = client.get("/api/v1/defenses").json()
    p_def = next(d for d in defs if d["id"] == "policy_enforcement")
    assert p_def["enabled"] is False

    # Restore defenses
    client.patch("/api/v1/defenses/secret_redaction", json={"enabled": True})
    client.patch("/api/v1/defenses/policy_enforcement", json={"enabled": True})
