'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Download,
  Filter,
  Search,
  CheckCircle,
  Clock,
  CheckCheck,
  ShieldAlert,
  Edit3,
  ExternalLink,
  Save,
  X,
} from 'lucide-react';
import { api, Finding, getFindingsCsvUrl } from '../../lib/api';

export default function FindingsPage() {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Editing note modal/inline state
  const [editingFinding, setEditingFinding] = useState<Finding | null>(null);
  const [editNote, setEditNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  const fetchFindings = () => {
    setLoading(true);
    setError('');
    api<Finding[]>('/findings')
      .then((res) => {
        setFindings(res || []);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchFindings();
  }, []);

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      const updated = await api<Finding>(`/findings/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      setFindings((prev) => prev.map((f) => (f.id === id ? { ...f, status: updated.status } : f)));
    } catch (err: any) {
      alert(`Status update failed: ${err.message}`);
    }
  };

  const handleSaveNote = async () => {
    if (!editingFinding) return;
    setSavingNote(true);
    try {
      const updated = await api<Finding>(`/findings/${editingFinding.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ note: editNote }),
      });
      setFindings((prev) => prev.map((f) => (f.id === editingFinding.id ? { ...f, note: updated.note } : f)));
      setEditingFinding(null);
    } catch (err: any) {
      alert(`Note update failed: ${err.message}`);
    } finally {
      setSavingNote(false);
    }
  };

  const filteredFindings = findings.filter((f) => {
    const matchesSev = severityFilter === 'all' || f.severity.toLowerCase() === severityFilter.toLowerCase();
    const matchesStatus = statusFilter === 'all' || f.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesSearch =
      !search ||
      f.title.toLowerCase().includes(search.toLowerCase()) ||
      f.description.toLowerCase().includes(search.toLowerCase()) ||
      f.key.toLowerCase().includes(search.toLowerCase());
    return matchesSev && matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-1">
            <span>Vulnerability Tracker</span>
            <span>•</span>
            <span>Remediation Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Security Findings</h1>
          <p className="text-sm text-slate-400 mt-1">
            Track, prioritize, and manage identified vulnerabilities from automated testing across all scans.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={getFindingsCsvUrl()}
            download
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-medium transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search findings by title, key, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Severity Filter */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-cyan-500/60 capitalize"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-cyan-500/60 capitalize"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="accepted_risk">Accepted Risk</option>
          </select>
        </div>
      </div>

      {/* Findings List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 animate-pulse">Loading findings records...</div>
        ) : filteredFindings.length === 0 ? (
          <div className="p-12 text-center rounded-xl bg-slate-900/40 border border-slate-800 space-y-2">
            <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
            <div className="text-sm font-semibold text-white">No Findings Encountered</div>
            <p className="text-xs text-slate-400">
              No matching vulnerability findings recorded in the selected view. Run a baseline scan to test failure scenarios.
            </p>
          </div>
        ) : (
          filteredFindings.map((finding) => (
            <div
              key={finding.id}
              className="p-5 rounded-xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700/80 space-y-3 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        finding.severity === 'critical'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : finding.severity === 'high'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                      }`}
                    >
                      {finding.severity}
                    </span>
                    <h2 className="text-sm font-bold text-white">{finding.title}</h2>
                    <span className="text-xs text-slate-500 font-mono">#{finding.key}</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{finding.description}</p>
                </div>

                {/* Status Switcher Dropdown */}
                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={finding.status}
                    onChange={(e) => handleStatusChange(finding.id, e.target.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider border focus:outline-none ${
                      finding.status === 'resolved'
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                        : finding.status === 'in_progress'
                        ? 'bg-blue-500/15 border-blue-500/40 text-blue-300'
                        : finding.status === 'accepted_risk'
                        ? 'bg-purple-500/15 border-purple-500/40 text-purple-300'
                        : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                    }`}
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="accepted_risk">Accepted Risk</option>
                  </select>

                  <Link
                    href={`/scans/${finding.scan_id}`}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 text-xs font-medium flex items-center gap-1"
                    title="View associated scan"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Observed Evidence */}
              <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800/80 text-xs font-mono text-rose-300/90 whitespace-pre-wrap">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1">
                  Observed Attack Evidence:
                </span>
                {finding.evidence}
              </div>

              {/* Remediation & Notes Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-800/60 text-xs text-slate-400">
                <div className="flex-1">
                  <strong className="text-cyan-400">Remediation:</strong> {finding.remediation}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {finding.note && (
                    <span className="text-[11px] text-slate-300 italic max-w-xs truncate">
                      Note: &ldquo;{finding.note}&rdquo;
                    </span>
                  )}
                  <button
                    onClick={() => {
                      setEditingFinding(finding);
                      setEditNote(finding.note || '');
                    }}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center gap-1.5 text-[11px]"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>{finding.note ? 'Edit Note' : 'Add Note'}</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Note Editing Modal */}
      {editingFinding && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm">
                Remediation Note: #{editingFinding.key}
              </h3>
              <button
                onClick={() => setEditingFinding(null)}
                className="text-slate-400 hover:text-white p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Internal Security Notes / Mitigation Plan
              </label>
              <textarea
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                placeholder="Document status updates, applied patches, or risk acceptance justifications..."
                className="w-full h-32 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingFinding(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNote}
                disabled={savingNote}
                className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingNote ? 'Saving...' : 'Save Note'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
