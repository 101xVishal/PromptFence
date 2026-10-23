from __future__ import annotations

import csv
import io
from datetime import datetime, timezone
from html import escape
from typing import Any
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.finding import Finding
from app.models.scan import Scan
from app.services.testing.runner import ScanRunner


class ReportGenerator:
    @staticmethod
    def generate_json(scan_id: int, session: Session) -> dict[str, Any]:
        scan = session.get(Scan, scan_id)
        if not scan:
            return {}

        scan_out = ScanRunner.serialize_scan(scan, session)
        findings = [
            {
                "id": f.id,
                "title": f.title,
                "category": f.category,
                "severity": f.severity,
                "status": f.status,
                "evidence": f.evidence,
                "remediation": f.remediation,
            }
            for f in scan.findings
        ]

        return {
            "project": "PromptFence",
            "report_version": "1.0",
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "scope": {
                "environment": "Local Educational Sandbox",
                "target_id": scan.target_id,
                "mode": scan.mode,
                "authorized_testing_only": True,
            },
            "disclaimer": (
                "PASS indicates that the defined test scenario expectation was satisfied. "
                "It does not constitute a compliance certification, penetration test guarantee, or proof of complete model security."
            ),
            "scan": scan_out.model_dump(),
            "findings": findings,
        }

    @staticmethod
    def generate_csv(scan_id: int, session: Session) -> str:
        scan = session.get(Scan, scan_id)
        if not scan:
            return ""

        scan_out = ScanRunner.serialize_scan(scan, session)
        output = io.StringIO()
        writer = csv.writer(output, quoting=csv.QUOTE_ALL)
        writer.writerow([
            "Scan ID",
            "Scan Name",
            "Mode",
            "Test ID",
            "Test Name",
            "Category",
            "Severity",
            "Is Attack",
            "Outcome",
            "Evidence",
            "Actual Response",
            "Explanation",
        ])

        for res in scan_out.results:
            writer.writerow([
                scan.id,
                scan.name,
                scan.mode,
                res.test_id,
                res.test.name,
                res.test.category,
                res.test.severity,
                "Yes" if res.test.is_attack else "No",
                res.outcome.value,
                res.evidence,
                res.response.replace("\n", " "),
                res.explanation,
            ])

        return output.getvalue()

    @staticmethod
    def generate_html(scan_id: int, session: Session) -> str:
        scan = session.get(Scan, scan_id)
        if not scan:
            return "<html><body><h1>Scan not found</h1></body></html>"

        scan_out = ScanRunner.serialize_scan(scan, session)
        m = scan_out.metrics

        asr_display = f"{m.attack_success_rate}%" if m.attack_success_rate is not None else "N/A"
        tpr_display = f"{m.test_pass_rate}%" if m.test_pass_rate is not None else "N/A"
        fpr_display = f"{m.benign_false_positive_rate}%" if m.benign_false_positive_rate is not None else "N/A"

        rows_html = []
        for r in scan_out.results:
            badge_color = (
                "#10b981" if r.outcome.value == "passed" else ("#ef4444" if r.outcome.value == "failed" else "#f59e0b")
            )
            rows_html.append(
                f"""
                <tr>
                    <td style="font-family: monospace; font-size: 13px; font-weight: bold;">{escape(r.test_id)}</td>
                    <td>
                        <div style="font-weight: 600; color: #1e293b;">{escape(r.test.name)}</div>
                        <div style="font-size: 12px; color: #64748b;">{escape(r.test.category)} • Severity: {escape(r.test.severity)}</div>
                    </td>
                    <td>
                        <span style="background: {badge_color}; color: #fff; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; text-transform: uppercase;">
                            {escape(r.outcome.value)}
                        </span>
                    </td>
                    <td style="font-size: 12px; color: #334155; max-width: 280px; word-break: break-word;">
                        <code>{escape(r.evidence)}</code>
                    </td>
                    <td style="font-size: 12px; color: #475569; max-width: 320px; word-break: break-word;">
                        {escape(r.response)}
                    </td>
                </tr>
                """
            )

        html_template = f"""<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>PromptFence Security Assessment Report - {escape(scan.name)}</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #0f172a;
            background: #f8fafc;
            margin: 0;
            padding: 40px;
        }}
        .container {{
            max-width: 1100px;
            margin: 0 auto;
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }}
        .header {{
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #0f172a;
            padding-bottom: 24px;
            margin-bottom: 32px;
        }}
        .brand-title {{
            font-size: 28px;
            font-weight: 800;
            letter-spacing: -0.5px;
            color: #0f172a;
            margin: 0 0 6px 0;
        }}
        .brand-sub {{
            font-size: 14px;
            color: #64748b;
            margin: 0;
        }}
        .meta-pill {{
            background: #f1f5f9;
            border: 1px solid #cbd5e1;
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 600;
            color: #334155;
            text-align: right;
        }}
        .metrics-grid {{
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
            margin-bottom: 36px;
        }}
        .metric-card {{
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 16px;
        }}
        .metric-label {{
            font-size: 12px;
            color: #64748b;
            text-transform: uppercase;
            font-weight: 600;
            margin-bottom: 6px;
        }}
        .metric-val {{
            font-size: 24px;
            font-weight: 700;
            color: #0f172a;
        }}
        table {{
            width: 100%;
            border-collapse: collapse;
            margin-top: 16px;
            font-size: 14px;
        }}
        th {{
            background: #f1f5f9;
            color: #475569;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            text-align: left;
            padding: 12px 14px;
            border-bottom: 2px solid #e2e8f0;
        }}
        td {{
            padding: 14px;
            border-bottom: 1px solid #f1f5f9;
            vertical-align: top;
        }}
        tr:hover td {{
            background: #fafafa;
        }}
        .disclaimer-box {{
            margin-top: 40px;
            padding: 16px 20px;
            background: #fffbeb;
            border: 1px solid #fef3c7;
            border-radius: 8px;
            font-size: 13px;
            color: #92400e;
            line-height: 1.5;
        }}
        @media print {{
            body {{ padding: 0; background: #fff; }}
            .container {{ border: none; box-shadow: none; padding: 0; }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div>
                <h1 class="brand-title">🛡️ PromptFence Security Assessment Report</h1>
                <p class="brand-sub">Application Security Testing &amp; Defense Platform</p>
            </div>
            <div class="meta-pill">
                Scan ID: #{scan.id}<br>
                Mode: <span style="text-transform: uppercase; color: {'#ef4444' if scan.mode == 'baseline' else '#10b981'};">{escape(scan.mode)}</span><br>
                Generated: {datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")}
            </div>
        </div>

        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-label">Attack Success Rate</div>
                <div class="metric-val" style="color: {'#ef4444' if (m.attack_success_rate or 0) > 0 else '#10b981'};">{asr_display}</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Test Pass Rate</div>
                <div class="metric-val">{tpr_display}</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">False-Positive Rate</div>
                <div class="metric-val">{fpr_display}</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Evaluated Tests</div>
                <div class="metric-val">{m.total} tests</div>
            </div>
        </div>

        <h2 style="font-size: 18px; color: #0f172a; margin-top: 28px; margin-bottom: 12px;">Detailed Test Execution Results</h2>
        <table>
            <thead>
                <tr>
                    <th style="width: 90px;">Test ID</th>
                    <th>Scenario &amp; Category</th>
                    <th style="width: 90px;">Outcome</th>
                    <th>Observed Evidence</th>
                    <th>Simulated Response</th>
                </tr>
            </thead>
            <tbody>
                {''.join(rows_html)}
            </tbody>
        </table>

        <div class="disclaimer-box">
            <strong>Methodology &amp; Academic MVP Notice:</strong><br>
            A PASS outcome signifies that the defined test scenario expectation was satisfied by the evaluation rules.
            It does not guarantee complete security against novel semantic jailbreaks or real-world zero-day vulnerabilities.
            Testing is strictly confined to the local synthetic sandbox environment.
        </div>
    </div>
</body>
</html>"""
        return html_template

    @staticmethod
    def generate_findings_csv(session: Session) -> str:
        findings = session.scalars(select(Finding).order_by(Finding.id.desc())).all()
        output = io.StringIO()
        writer = csv.writer(output, quoting=csv.QUOTE_ALL)
        writer.writerow(["ID", "Scan ID", "Key", "Title", "Category", "Severity", "Confidence", "Status", "Evidence", "Remediation", "Notes"])
        for f in findings:
            writer.writerow([
                f.id,
                f.scan_id,
                f.key,
                f.title,
                f.category,
                f.severity,
                f.confidence,
                f.status,
                f.evidence,
                f.remediation,
                f.note,
            ])
        return output.getvalue()
