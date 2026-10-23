'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  Scan as ScanIcon,
  PlusCircle,
  Search,
  Trash2,
  RotateCcw,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { api, Scan } from '../../lib/api';
import { formatDate, formatTime } from '../../lib/date';

export default function ScansListPage() {
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [modeFilter, setModeFilter] = useState<'all' | 'baseline' | 'protected'>('all');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [rerunningId, setRerunningId] = useState<number | null>(null);

  const fetchScans = () => {
    setLoading(true);
    setError('');
    api<Scan[]>('/scans')
      .then((res) => {
        setScans(res || []);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchScans();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm(`Are you sure you want to delete scan #${id}? All associated results will be removed.`)) {
      return;
    }
    setDeletingId(id);
    try {
      await api(`/scans/${id}`, { method: 'DELETE' });
      setScans((prev) => prev.filter((s) => s.id !== id));
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleRerun = async (id: number) => {
    setRerunningId(id);
    try {
      const res = await api<Scan>(`/scans/${id}/rerun`, { method: 'POST' });
      setScans((prev) => [res, ...prev]);
    } catch (err: any) {
      alert(`Rerun failed: ${err.message}`);
    } finally {
      setRerunningId(null);
    }
  };

  const filteredScans = scans.filter((s) => {
    const matchesMode = modeFilter === 'all' || s.mode === modeFilter;
    const matchesSearch =
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      String(s.id).includes(search);
    return matchesMode && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-1">
            <span>Assessment History</span>
            <span>•</span>
            <span>Persisted Scans</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Security Scans</h1>
          <p className="text-sm text-slate-400 mt-1">
            Review test run outcomes, attack success benchmarks, and inspect full execution traces.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchScans}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-medium transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <Link
            href="/scans/new"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Launch New Scan</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search scans by name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60"
          />
        </div>

        {/* Mode Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-950 border border-slate-800 text-xs">
          {(['all', 'baseline', 'protected'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setModeFilter(m)}
              className={`px-3 py-1 rounded text-xs capitalize font-medium transition-colors ${modeFilter === m ? 'bg-slate-800 text-cyan-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Scans Table */}
      <div className="rounded-xl bg-slate-900/70 border border-slate-800/80 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 animate-pulse">Loading scan history...</div>
        ) : filteredScans.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <ScanIcon className="w-8 h-8 text-slate-600 mx-auto" />
            <div className="text-sm font-semibold text-slate-300">No scans found</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No security scans matched your search criteria or none have been executed yet.
            </p>
            <Link
              href="/scans/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold mt-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Launch First Scan</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px] bg-slate-950/40">
                  <th className="py-3 px-4 font-semibold">ID / Name</th>
                  <th className="py-3 px-3 font-semibold">Mode</th>
                  <th className="py-3 px-3 font-semibold">Status</th>
                  <th className="py-3 px-3 font-semibold">Attack Success Rate</th>
                  <th className="py-3 px-3 font-semibold">Pass / Fail Breakdown</th>
                  <th className="py-3 px-3 font-semibold">Execution Time</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredScans.map((scan) => (
                  <tr key={scan.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-200">
                        <Link href={`/scans/${scan.id}`} className="hover:text-cyan-400">
                          {scan.name}
                        </Link>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">#{scan.id} • Target: {scan.target_id}</div>
                    </td>

                    <td className="py-3.5 px-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${scan.mode === 'protected'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          }`}
                      >
                        {scan.mode === 'protected' ? (
                          <ShieldCheck className="w-3 h-3" />
                        ) : (
                          <ShieldAlert className="w-3 h-3" />
                        )}
                        <span>{scan.mode}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="capitalize font-medium text-slate-300">{scan.status}</span>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="space-y-1">
                        <span className="font-mono font-bold text-slate-200 text-xs">
                          {scan.metrics.attack_success_rate !== null ? `${scan.metrics.attack_success_rate}%` : 'N/A'}
                        </span>
                        {scan.metrics.attack_success_rate !== null && (
                          <div className="w-24 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className={`h-full ${scan.metrics.attack_success_rate > 50
                                  ? 'bg-rose-500'
                                  : scan.metrics.attack_success_rate > 0
                                    ? 'bg-amber-400'
                                    : 'bg-emerald-400'
                                }`}
                              style={{ width: `${Math.min(scan.metrics.attack_success_rate, 100)}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="text-slate-300">
                        <span className="text-emerald-400 font-semibold">{scan.metrics.passed} Pass</span>
                        <span className="text-slate-500 mx-1">/</span>
                        <span className="text-rose-400 font-semibold">{scan.metrics.failed} Fail</span>
                        {scan.metrics.review > 0 && (
                          <>
                            <span className="text-slate-500 mx-1">/</span>
                            <span className="text-amber-400 font-semibold">{scan.metrics.review} Rev</span>
                          </>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{scan.metrics.total} total tests</div>
                    </td>

                    <td className="py-3.5 px-3 text-slate-400">
                      <div suppressHydrationWarning>{formatDate(scan.created_at)}</div>
                      <div className="text-[10px] text-slate-500" suppressHydrationWarning>
                        {formatTime(scan.created_at)} • {scan.duration_ms}ms
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/scans/${scan.id}`}
                          className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-400"
                          title="View scan details"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleRerun(scan.id)}
                          disabled={rerunningId === scan.id}
                          className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-emerald-400 disabled:opacity-50"
                          title="Rerun this scan"
                        >
                          <RotateCcw className={`w-4 h-4 ${rerunningId === scan.id ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                          onClick={() => handleDelete(scan.id)}
                          disabled={deletingId === scan.id}
                          className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-400 disabled:opacity-50"
                          title="Delete scan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
