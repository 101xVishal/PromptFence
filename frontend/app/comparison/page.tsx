'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  GitCompare,
  TrendingDown,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Info,
} from 'lucide-react';
import { api, Scan, ComparisonResponse } from '../../lib/api';

export default function ComparisonPage() {
  const [scans, setScans] = useState<Scan[]>([]);
  const [loadingScans, setLoadingScans] = useState(true);
  const [scanAId, setScanAId] = useState<string>('');
  const [scanBId, setScanBId] = useState<string>('');

  const [comparison, setComparison] = useState<ComparisonResponse | null>(null);
  const [comparing, setComparing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api<Scan[]>('/scans')
      .then((res) => {
        setScans(res || []);
        // Auto-select latest baseline and latest protected scan if available
        const latestBaseline = (res || []).find((s) => s.mode === 'baseline');
        const latestProtected = (res || []).find((s) => s.mode === 'protected');
        if (latestBaseline) setScanAId(String(latestBaseline.id));
        if (latestProtected) setScanBId(String(latestProtected.id));
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoadingScans(false);
      });
  }, []);

  const handleRunComparison = async () => {
    if (!scanAId || !scanBId) {
      setError('Please select two scans to compare.');
      return;
    }
    if (scanAId === scanBId) {
      setError('Please select two distinct scans to compare.');
      return;
    }

    setComparing(true);
    setError('');

    try {
      const res = await api<ComparisonResponse>(`/comparison?scan_a=${scanAId}&scan_b=${scanBId}`);
      setComparison(res);
    } catch (err: any) {
      setError(err.message);
      setComparison(null);
    } finally {
      setComparing(false);
    }
  };

  // Auto-trigger comparison if both initial scans are found
  useEffect(() => {
    if (scanAId && scanBId && scanAId !== scanBId && !comparison && !comparing) {
      handleRunComparison();
    }
  }, [scanAId, scanBId]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="border-b border-slate-800/80 pb-5">
        <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-1">
          <span>Comparative Analytics</span>
          <span>•</span>
          <span>Defense Benchmarking</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Before-and-After Comparison</h1>
        <p className="text-sm text-slate-400 mt-1">
          Compare identical test suite runs across Baseline and Protected modes to evaluate defense effectiveness and verify zero false-positives.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Scan Selection Strip */}
      <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800/80 space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <GitCompare className="w-4 h-4 text-cyan-400" />
          <span>Select Scan Pair</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              Scan A (Typically Baseline / Unhardened)
            </label>
            <select
              value={scanAId}
              onChange={(e) => setScanAId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500/60"
            >
              <option value="">Select first scan...</option>
              {scans.map((s) => (
                <option key={s.id} value={s.id}>
                  #{s.id} — {s.name} ({s.mode.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              Scan B (Typically Protected / Defenses Active)
            </label>
            <select
              value={scanBId}
              onChange={(e) => setScanBId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500/60"
            >
              <option value="">Select second scan...</option>
              {scans.map((s) => (
                <option key={s.id} value={s.id}>
                  #{s.id} — {s.name} ({s.mode.toUpperCase()})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={handleRunComparison}
            disabled={comparing || !scanAId || !scanBId || scanAId === scanBId}
            className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-md shadow-cyan-600/20 disabled:opacity-50 transition-all flex items-center gap-2"
          >
            <GitCompare className={`w-3.5 h-3.5 ${comparing ? 'animate-spin' : ''}`} />
            <span>{comparing ? 'Calculating Metrics...' : 'Compare Scans'}</span>
          </button>
        </div>
      </div>

      {comparison && (
        <div className="space-y-6">
          {/* Top Comparative KPI Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: Attack Success Rate Delta */}
            <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800">
              <span className="text-xs text-slate-400 font-medium block mb-1">Attack Success Rate Delta</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-white font-mono">
                  {comparison.attack_success_rate_a !== null ? `${comparison.attack_success_rate_a}%` : 'N/A'}
                </span>
                <span className="text-xs text-slate-500 font-bold">→</span>
                <span className="text-2xl font-extrabold text-emerald-400 font-mono">
                  {comparison.attack_success_rate_b !== null ? `${comparison.attack_success_rate_b}%` : 'N/A'}
                </span>
              </div>
              <div className="mt-2 text-xs text-emerald-400 font-semibold flex items-center gap-1">
                <TrendingDown className="w-3.5 h-3.5" />
                <span>
                  {comparison.rate_difference_percentage_points !== null
                    ? `${comparison.rate_difference_percentage_points} pp reduction`
                    : 'N/A'}
                </span>
              </div>
            </div>

            {/* KPI 2: Newly Blocked Attacks */}
            <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800">
              <span className="text-xs text-slate-400 font-medium block mb-1">Newly Blocked Attacks</span>
              <div className="text-3xl font-extrabold text-emerald-400 font-mono">
                {comparison.newly_blocked_count}
              </div>
              <div className="mt-2 text-xs text-slate-400">
                Failed in Scan A, Neutralized in Scan B
              </div>
            </div>

            {/* KPI 3: Persistent Failures */}
            <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800">
              <span className="text-xs text-slate-400 font-medium block mb-1">Persistent Weaknesses</span>
              <div className="text-3xl font-extrabold text-rose-400 font-mono">
                {comparison.persistent_failures_count}
              </div>
              <div className="mt-2 text-xs text-slate-400">
                Failed across both configurations
              </div>
            </div>

            {/* KPI 4: False Positives */}
            <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800">
              <span className="text-xs text-slate-400 font-medium block mb-1">Benign False-Positives</span>
              <div className="text-3xl font-extrabold text-white font-mono">
                {comparison.false_positives_count}
              </div>
              <div className="mt-2 text-xs text-slate-400">
                Benign checks mistakenly blocked
              </div>
            </div>
          </div>

          {/* Test Comparison Table */}
          <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Scenario-by-Scenario Result Changes</h3>
                <p className="text-xs text-slate-400">
                  Detailed outcome delta across {comparison.matching_test_ids.length} matching test scenarios
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px] bg-slate-950/40">
                    <th className="py-3 px-3 font-semibold">Test ID &amp; Name</th>
                    <th className="py-3 px-3 font-semibold">Category</th>
                    <th className="py-3 px-3 font-semibold">Scan A ({comparison.scan_a.mode})</th>
                    <th className="py-3 px-3 font-semibold">Scan B ({comparison.scan_b.mode})</th>
                    <th className="py-3 px-3 font-semibold">Status Transition</th>
                    <th className="py-3 px-3 font-semibold">Security Rationale</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {comparison.rows.map((row) => (
                    <tr key={row.test_id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-mono font-bold text-slate-200">{row.test_id}</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[200px]">{row.name}</div>
                      </td>

                      <td className="py-3 px-3 text-slate-400 text-[11px]">{row.category}</td>

                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            row.baseline_outcome === 'passed'
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : 'bg-rose-500/15 text-rose-400'
                          }`}
                        >
                          {row.baseline_outcome}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            row.protected_outcome === 'passed'
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : 'bg-rose-500/15 text-rose-400'
                          }`}
                        >
                          {row.protected_outcome}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            row.status_change === 'BLOCKED_BY_DEFENSE'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : row.status_change === 'PERSISTENT_FAILURE'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : row.status_change === 'FALSE_POSITIVE'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                          }`}
                        >
                          {row.status_change.replace(/_/g, ' ')}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-slate-300 text-[11px] max-w-sm">{row.explanation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
