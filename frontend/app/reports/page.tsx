'use client';

import { useEffect, useState } from 'react';
import {
  FileText,
  Download,
  FileCode,
  FileSpreadsheet,
  Globe,
  Info,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { api, Scan, getReportDownloadUrl, getFindingsCsvUrl } from '../../lib/api';

export default function ReportsPage() {
  const [scans, setScans] = useState<Scan[]>([]);
  const [selectedScanId, setSelectedScanId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api<Scan[]>('/scans')
      .then((res) => {
        setScans(res || []);
        if (res && res.length > 0) {
          setSelectedScanId(String(res[0].id));
        }
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const selectedScan = scans.find((s) => String(s.id) === selectedScanId);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="border-b border-slate-800/80 pb-5">
        <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-1">
          <span>Audit Documentation</span>
          <span>•</span>
          <span>Downloadable Deliverables</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Security Reports</h1>
        <p className="text-sm text-slate-400 mt-1">
          Generate, preview, and download formal security evaluation artifacts in JSON, CSV, and printable HTML formats.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Scan Selector & Global Findings Download */}
      <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1 max-w-md">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Select Assessment Scan for Export:
            </label>
            <select
              value={selectedScanId}
              onChange={(e) => setSelectedScanId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500/60"
            >
              {scans.length === 0 ? (
                <option value="">No completed scans found</option>
              ) : (
                scans.map((s) => (
                  <option key={s.id} value={s.id}>
                    #{s.id} — {s.name} ({s.mode.toUpperCase()}) • {s.metrics.total} tests
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="pt-2 sm:pt-4">
            <a
              href={getFindingsCsvUrl()}
              download
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Download All Findings (CSV)</span>
            </a>
          </div>
        </div>
      </div>

      {/* Selected Scan Download Cards */}
      {selectedScan ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* JSON Report Card */}
            <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-cyan-400">
                  <FileCode className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-white text-sm">JSON Machine-Readable Report</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Structured JSON payload containing full scan metadata, per-test evaluation telemetry, evidence strings, and findings.
                </p>
              </div>

              <a
                href={getReportDownloadUrl(selectedScan.id, 'json')}
                download
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 font-semibold text-xs border border-slate-700 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .JSON</span>
              </a>
            </div>

            {/* CSV Report Card */}
            <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-white text-sm">CSV Spreadsheet Export</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  RFC 4180 standard spreadsheet export with escaped fields for importing into Excel, Google Sheets, or SIEM tools.
                </p>
              </div>

              <a
                href={getReportDownloadUrl(selectedScan.id, 'csv')}
                download
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 font-semibold text-xs border border-slate-700 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .CSV</span>
              </a>
            </div>

            {/* HTML Printable Report Card */}
            <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Globe className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-white text-sm">Printable HTML Dossier</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Self-contained, styled executive security report with summary cards and tables. Ready to open in browser or print to PDF.
                </p>
              </div>

              <a
                href={getReportDownloadUrl(selectedScan.id, 'html')}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md shadow-blue-600/20 transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open / Print HTML</span>
              </a>
            </div>
          </div>

          {/* Executive Summary Preview */}
          <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">Document Preview</span>
                <h3 className="text-base font-bold text-white">Executive Assessment Summary</h3>
              </div>
              <span className="text-xs text-slate-500 font-mono">Scan #{selectedScan.id}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Target Name</span>
                <span className="text-white font-medium">{selectedScan.target_id}</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Security Posture</span>
                <span className="capitalize font-bold text-cyan-300">{selectedScan.mode} Mode</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Attack Success Rate</span>
                <span className="font-mono font-bold text-rose-400">
                  {selectedScan.metrics.attack_success_rate !== null ? `${selectedScan.metrics.attack_success_rate}%` : 'N/A'}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Scenarios Evaluated</span>
                <span className="font-mono text-slate-200">{selectedScan.metrics.total} tests</span>
              </div>
            </div>

            {/* Methodology notice */}
            <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-3">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong>Methodology &amp; Reporting Scope:</strong> A PASS outcome indicates that the defined test expectation was satisfied by deterministic evaluation rules. It does not constitute a formal penetration-testing certificate, compliance warranty, or absolute guarantee of model security.
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center text-xs text-slate-500">
          No scans available for report generation. Execute a scan to create assessment reports.
        </div>
      )}
    </div>
  );
}
