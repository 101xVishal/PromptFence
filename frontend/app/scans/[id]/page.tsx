'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  RotateCcw,
  Download,
  FileCode,
  FileSpreadsheet,
  Globe,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Lightbulb,
  Terminal,
} from 'lucide-react';
import { api, Scan, getReportDownloadUrl } from '../../../lib/api';
import { formatDateTime } from '../../../lib/date';

export default function ScanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const scanId = params.id as string;

  const [scan, setScan] = useState<Scan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState<'all' | 'failed' | 'passed' | 'review'>('all');
  const [expandedTests, setExpandedTests] = useState<Record<string, boolean>>({});
  const [rerunning, setRerunning] = useState(false);

  useEffect(() => {
    if (!scanId) return;
    setLoading(true);
    api<Scan>(`/scans/${scanId}`)
      .then((res) => {
        setScan(res);
        // Expand failed tests by default
        const initialExpanded: Record<string, boolean> = {};
        res.results.forEach((r) => {
          if (r.outcome === 'failed') initialExpanded[r.test_id] = true;
        });
        setExpandedTests(initialExpanded);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [scanId]);

  const toggleExpand = (testId: string) => {
    setExpandedTests((prev) => ({
      ...prev,
      [testId]: !prev[testId],
    }));
  };

  const handleRerun = async () => {
    if (!scan) return;
    setRerunning(true);
    try {
      const res = await api<Scan>(`/scans/${scan.id}/rerun`, { method: 'POST' });
      router.push(`/scans/${res.id}`);
    } catch (err: any) {
      alert(`Rerun failed: ${err.message}`);
      setRerunning(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-slate-500 animate-pulse">
        Loading scan details #{scanId}...
      </div>
    );
  }

  if (error || !scan) {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="text-rose-400 text-sm font-semibold">{error || 'Scan not found'}</div>
        <Link href="/scans" className="inline-flex items-center gap-2 text-xs text-cyan-400 hover:underline">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Scans List</span>
        </Link>
      </div>
    );
  }

  const m = scan.metrics;
  const filteredResults = scan.results.filter((r) => {
    if (outcomeFilter === 'all') return true;
    return r.outcome === outcomeFilter;
  });

  return (
    <div className="space-y-6">
      {/* Top Nav Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/scans"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 font-medium transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Scans</span>
        </Link>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleRerun}
            disabled={rerunning}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-medium transition-all"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${rerunning ? 'animate-spin' : ''}`} />
            <span>Rerun Scan</span>
          </button>

          {/* Report Dropdown Links */}
          <a
            href={getReportDownloadUrl(scan.id, 'json')}
            download
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-medium transition-all"
          >
            <FileCode className="w-3.5 h-3.5 text-cyan-400" />
            <span>JSON</span>
          </a>

          <a
            href={getReportDownloadUrl(scan.id, 'csv')}
            download
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-medium transition-all"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>CSV</span>
          </a>

          <a
            href={getReportDownloadUrl(scan.id, 'html')}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition-all"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>HTML Report</span>
          </a>
        </div>
      </div>

      {/* Scan Summary Banner */}
      <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  scan.mode === 'protected'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                }`}
              >
                {scan.mode === 'protected' ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                <span>{scan.mode} Mode</span>
              </span>
              <span className="text-xs text-slate-500 font-mono">Scan #{scan.id}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">{scan.name}</h1>
            <p className="text-xs text-slate-400 mt-1">
              Target: <span className="font-mono text-cyan-300">{scan.target_id}</span> • Executed on{' '}
              <span suppressHydrationWarning>{formatDateTime(scan.created_at)}</span> • Duration: {scan.duration_ms}ms
            </p>
          </div>

          <div className="flex items-center gap-4 border-t sm:border-t-0 sm:border-l border-slate-800 pt-3 sm:pt-0 sm:pl-6">
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Attack Success Rate</div>
              <div
                className={`text-3xl font-extrabold font-mono mt-0.5 ${
                  (m.attack_success_rate || 0) > 0 ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {m.attack_success_rate !== null ? `${m.attack_success_rate}%` : 'N/A'}
              </div>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-800/80">
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/60">
            <div className="text-[10px] text-slate-500 uppercase font-semibold">Total Scenarios</div>
            <div className="text-xl font-bold text-white mt-1">{m.total} tests</div>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/60">
            <div className="text-[10px] text-emerald-400 uppercase font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Passed (Neutralized)</span>
            </div>
            <div className="text-xl font-bold text-emerald-400 mt-1">{m.passed}</div>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/60">
            <div className="text-[10px] text-rose-400 uppercase font-semibold flex items-center gap-1">
              <XCircle className="w-3 h-3" />
              <span>Failed (Vulnerable)</span>
            </div>
            <div className="text-xl font-bold text-rose-400 mt-1">{m.failed}</div>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/60">
            <div className="text-[10px] text-amber-400 uppercase font-semibold flex items-center gap-1">
              <HelpCircle className="w-3 h-3" />
              <span>Review Needed</span>
            </div>
            <div className="text-xl font-bold text-amber-400 mt-1">{m.review}</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-1 text-xs">
          {(['all', 'failed', 'passed', 'review'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setOutcomeFilter(tab)}
              className={`px-3 py-1.5 rounded-lg capitalize font-medium transition-colors ${
                outcomeFilter === tab
                  ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab} (
              {tab === 'all'
                ? scan.results.length
                : scan.results.filter((r) => r.outcome === tab).length}
              )
            </button>
          ))}
        </div>

        <div className="text-xs text-slate-500">
          Showing {filteredResults.length} of {scan.results.length} test results
        </div>
      </div>

      {/* Detailed Test Results Accordion List */}
      <div className="space-y-3">
        {filteredResults.map((result) => {
          const isExpanded = expandedTests[result.test_id];
          const isPassed = result.outcome === 'passed';
          const isFailed = result.outcome === 'failed';

          return (
            <div
              key={result.id}
              className={`rounded-xl border transition-all ${
                isFailed
                  ? 'bg-slate-900/70 border-rose-500/30'
                  : isPassed
                  ? 'bg-slate-900/50 border-slate-800/80'
                  : 'bg-slate-900/50 border-amber-500/30'
              }`}
            >
              {/* Header Bar */}
              <div
                onClick={() => toggleExpand(result.test_id)}
                className="p-4 flex items-center justify-between cursor-pointer select-none hover:bg-slate-800/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                      isPassed
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : isFailed
                        ? 'bg-rose-500/15 text-rose-400'
                        : 'bg-amber-500/15 text-amber-400'
                    }`}
                  >
                    {isPassed ? <CheckCircle2 className="w-4 h-4" /> : isFailed ? <XCircle className="w-4 h-4" /> : <HelpCircle className="w-4 h-4" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-slate-300">{result.test_id}</span>
                      <span className="text-xs font-bold text-white">{result.test.name}</span>
                      <span className="text-[10px] text-slate-400">• {result.test.category}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{result.test.description}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      isPassed
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : isFailed
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    {result.outcome}
                  </span>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </div>
              </div>

              {/* Collapsible Details Drawer */}
              {isExpanded && (
                <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 space-y-4 text-xs">
                  {/* Prompt Box */}
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">
                      Attack Scenario Prompt
                    </span>
                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 font-mono text-[11px] whitespace-pre-wrap">
                      {result.test.prompt}
                    </div>
                  </div>

                  {/* Actual Chatbot Response Box */}
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">
                      Actual Model Response ({scan.mode} Mode)
                    </span>
                    <div
                      className={`p-3 rounded-lg border font-mono text-[11px] whitespace-pre-wrap leading-relaxed ${
                        isFailed
                          ? 'bg-rose-500/5 border-rose-500/30 text-rose-200'
                          : 'bg-slate-900 border-slate-800 text-slate-300'
                      }`}
                    >
                      {result.response}
                    </div>
                  </div>

                  {/* Observed Evidence & Evaluation Rule */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                        Evaluation Rule &amp; Indicator
                      </span>
                      <div className="font-mono text-cyan-300 text-[11px] mb-1">{result.evidence}</div>
                      <p className="text-slate-400 text-[11px] leading-relaxed">{result.explanation}</p>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                        Defense Telemetry Events
                      </span>
                      {result.defense_events.length > 0 ? (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {result.defense_events.map((ev) => (
                            <span
                              key={ev}
                              className="px-2 py-0.5 rounded font-mono text-[10px] bg-slate-800 border border-slate-700 text-slate-300"
                            >
                              {ev}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-500 text-[11px]">No defense events emitted (baseline mode)</span>
                      )}
                    </div>
                  </div>

                  {/* Remediation Guidance */}
                  <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-slate-300 text-[11px] flex items-start gap-2.5">
                    <Lightbulb className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-cyan-300 block mb-0.5">Recommended Remediation:</strong>
                      <span>{result.test.remediation}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
