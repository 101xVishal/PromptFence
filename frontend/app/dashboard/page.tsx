'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Activity,
  AlertTriangle,
  Play,
  Terminal,
  ArrowRight,
  TrendingDown,
  RefreshCw,
  FileText,
  Sliders,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { api, DashboardSummary } from '../../lib/api';
import { formatDateTime } from '../../lib/date';

export default function DashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [initializing, setInitializing] = useState(false);

  const fetchDashboard = () => {
    setLoading(true);
    setError('');
    api<DashboardSummary>('/dashboard/summary')
      .then((res) => {
        setData(res);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const runFirstScan = async () => {
    setInitializing(true);
    try {
      await api('/scans', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Initial Baseline Demo Scan',
          mode: 'baseline',
        }),
      });
      fetchDashboard();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setInitializing(false);
    }
  };

  const categoryChartData = (data?.results_by_category || []).map((cat) => ({
    name: cat.category.replace('prompt ', '').replace('information ', ''),
    failed: cat.failed,
    passed: cat.passed,
    total: cat.total,
  }));

  const COLORS = ['#ef4444', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'];

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-1">
            <span>Cybersecurity Workspace</span>
            <span>•</span>
            <span>Local Evaluation Environment</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Security Assessment Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time telemetry, vulnerability findings, and defensive benchmarking for application workloads.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboard}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-medium transition-all"
            title="Refresh dashboard metrics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <Link
            href="/scans/new"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>New Scan</span>
          </Link>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={fetchDashboard} className="underline text-xs hover:text-white font-medium">
            Try again
          </button>
        </div>
      )}

      {loading && !data ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-slate-900/60 border border-slate-800/80 animate-pulse" />
          ))}
        </div>
      ) : data?.total_scans === 0 ? (
        /* Empty State */
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 max-w-2xl mx-auto space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-cyan-400">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-white">No Security Scans Executed Yet</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            PromptFence evaluates your application against controlled direct injection, sensitive disclosure, indirect ingestion, and unauthorized action scenarios.
          </p>
          <div className="pt-2">
            <button
              onClick={runFirstScan}
              disabled={initializing}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-all shadow-lg shadow-cyan-600/20"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>{initializing ? 'Running Baseline Scan...' : 'Initialize Demo Baseline Scan'}</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Key Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Stat 1: Attack Success Rate */}
            <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700/80 transition-all">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="font-medium">Attack Success Rate</span>
                <ShieldAlert className="w-4 h-4 text-amber-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white">
                  {data?.attack_success_rate !== null ? `${data?.attack_success_rate}%` : 'N/A'}
                </span>
                <span className="text-xs text-slate-500">across scans</span>
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-xs text-cyan-400">
                <TrendingDown className="w-3.5 h-3.5" />
                <span>Lower is safer in protected mode</span>
              </div>
            </div>

            {/* Stat 2: Total Scans Executed */}
            <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700/80 transition-all">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="font-medium">Total Scans Executed</span>
                <Activity className="w-4 h-4 text-blue-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white">{data?.total_scans || 0}</span>
                <span className="text-xs text-slate-500">runs</span>
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                <span className="text-rose-400 font-semibold">{data?.baseline_scans_count || 0} Baseline</span>
                <span>•</span>
                <span className="text-emerald-400 font-semibold">{data?.protected_scans_count || 0} Protected</span>
              </div>
            </div>

            {/* Stat 3: Vulnerability Findings */}
            <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700/80 transition-all">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="font-medium">Open Findings</span>
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white">{data?.open_findings_count || 0}</span>
                <span className="text-xs text-slate-500">unresolved</span>
              </div>
              <div className="mt-3 text-xs text-rose-400 font-medium">
                {data?.critical_findings_count || 0} critical or high severity
              </div>
            </div>

            {/* Stat 4: Test Outcome Breakdown */}
            <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700/80 transition-all">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="font-medium">Evaluated Outcomes</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex items-center gap-3 mt-1">
                <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span className="font-bold text-white text-base">{data?.passed_tests || 0}</span> Pass
                </div>
                <div className="flex items-center gap-1.5 text-xs text-rose-400">
                  <XCircle className="w-3.5 h-3.5" />
                  <span className="font-bold text-white text-base">{data?.failed_tests || 0}</span> Fail
                </div>
                <div className="flex items-center gap-1.5 text-xs text-amber-400">
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span className="font-bold text-white text-base">{data?.review_tests || 0}</span> Rev
                </div>
              </div>
              <div className="mt-3 text-[11px] text-slate-400">Based on strict deterministic rules</div>
            </div>
          </div>

          {/* Quick Action Navigation Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link
              href="/sandbox"
              className="p-3.5 rounded-lg bg-slate-900/50 border border-slate-800 hover:border-cyan-500/40 flex items-center justify-between group transition-all"
            >
              <div className="flex items-center gap-2.5">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300">Sandbox</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
            </Link>

            <Link
              href="/defenses"
              className="p-3.5 rounded-lg bg-slate-900/50 border border-slate-800 hover:border-cyan-500/40 flex items-center justify-between group transition-all"
            >
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold text-slate-200 group-hover:text-emerald-300">Defense Center</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
            </Link>

            <Link
              href="/comparison"
              className="p-3.5 rounded-lg bg-slate-900/50 border border-slate-800 hover:border-cyan-500/40 flex items-center justify-between group transition-all"
            >
              <div className="flex items-center gap-2.5">
                <Sliders className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-semibold text-slate-200 group-hover:text-blue-300">Compare Runs</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
            </Link>

            <Link
              href="/reports"
              className="p-3.5 rounded-lg bg-slate-900/50 border border-slate-800 hover:border-cyan-500/40 flex items-center justify-between group transition-all"
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-semibold text-slate-200 group-hover:text-purple-300">Security Reports</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all" />
            </Link>
          </div>

          {/* Charts & Analytics Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart: Failures by Category */}
            <div className="lg:col-span-2 p-5 rounded-xl bg-slate-900/70 border border-slate-800/80">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white">Security Test Failures by Category</h3>
                  <p className="text-xs text-slate-400">Compares vulnerability detections across attack vectors</p>
                </div>
              </div>

              {categoryChartData.length > 0 ? (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                      <XAxis dataKey="name" stroke="#64748b" fontSize={11} angle={-15} textAnchor="end" />
                      <YAxis stroke="#64748b" fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          border: '1px solid #334155',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="failed" name="Failed (Vulnerable)" fill="#ef4444" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="passed" name="Passed (Mitigated)" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-xs text-slate-500">
                  Execute scans to view attack category telemetry
                </div>
              )}
            </div>

            {/* Findings by Severity Card */}
            <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800/80 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-white mb-1">Findings by Severity</h3>
                <p className="text-xs text-slate-400 mb-4">Current distribution of open security findings</p>

                <div className="space-y-3">
                  {[
                    { key: 'critical', label: 'Critical Severity', color: 'bg-rose-500 text-rose-300 border-rose-500/30' },
                    { key: 'high', label: 'High Severity', color: 'bg-amber-500 text-amber-300 border-amber-500/30' },
                    { key: 'medium', label: 'Medium Severity', color: 'bg-blue-500 text-blue-300 border-blue-500/30' },
                    { key: 'low', label: 'Low Severity', color: 'bg-emerald-500 text-emerald-300 border-emerald-500/30' },
                  ].map((sev) => {
                    const count = data?.findings_by_severity.find((f) => f.severity.toLowerCase() === sev.key)?.count || 0;
                    return (
                      <div key={sev.key} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/60">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${sev.color.split(' ')[0]}`} />
                          <span className="text-xs font-medium text-slate-300">{sev.label}</span>
                        </div>
                        <span className="font-mono text-xs font-bold text-white px-2 py-0.5 rounded bg-slate-800">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-800">
                <Link
                  href="/findings"
                  className="flex items-center justify-between text-xs text-cyan-400 hover:text-cyan-300 font-medium"
                >
                  <span>Review all findings</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* Recent Scans Table */}
          <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Recent Security Scans</h3>
                <p className="text-xs text-slate-400">History of automated test runs against target applications</p>
              </div>
              <Link href="/scans" className="text-xs text-cyan-400 hover:text-cyan-300 font-medium">
                View all scans →
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                    <th className="pb-3 font-semibold">Scan Name</th>
                    <th className="pb-3 font-semibold">Mode</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold">Attack Success Rate</th>
                    <th className="pb-3 font-semibold">Passed / Failed</th>
                    <th className="pb-3 font-semibold">Created At</th>
                    <th className="pb-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {data?.recent_scans.slice(0, 5).map((scan) => (
                    <tr key={scan.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 font-medium text-slate-200">
                        <Link href={`/scans/${scan.id}`} className="hover:text-cyan-400">
                          {scan.name}
                        </Link>
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            scan.mode === 'protected'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {scan.mode}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className="capitalize text-slate-300 font-medium">{scan.status}</span>
                      </td>
                      <td className="py-3">
                        <span className="font-mono font-bold text-slate-200">
                          {scan.metrics.attack_success_rate !== null ? `${scan.metrics.attack_success_rate}%` : 'N/A'}
                        </span>
                      </td>
                      <td className="py-3 text-slate-400">
                        <span className="text-emerald-400 font-medium">{scan.metrics.passed}P</span> /{' '}
                        <span className="text-rose-400 font-medium">{scan.metrics.failed}F</span>
                      </td>
                      <td className="py-3 text-slate-400" suppressHydrationWarning>
                        {formatDateTime(scan.created_at)}
                      </td>
                      <td className="py-3 text-right">
                        <Link
                          href={`/scans/${scan.id}`}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium"
                        >
                          Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
