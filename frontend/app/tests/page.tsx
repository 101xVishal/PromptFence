'use client';

import { useEffect, useState } from 'react';
import {
  FileCode,
  Search,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  CheckCircle,
  Tag,
  Lightbulb,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { api, TestCase } from '../../lib/api';

export default function TestCatalogPage() {
  const [tests, setTests] = useState<TestCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [enabledFilter, setEnabledFilter] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);

  const fetchTests = () => {
    setLoading(true);
    setError('');
    api<TestCase[]>('/tests')
      .then((res) => {
        setTests(res || []);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchTests();
  }, []);

  const handleToggle = async (id: string, currentEnabled: boolean) => {
    try {
      const updated = await api<TestCase>(`/tests/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ enabled: !currentEnabled }),
      });
      setTests((prev) => prev.map((t) => (t.id === id ? { ...t, enabled: updated.enabled } : t)));
    } catch (err: any) {
      alert(`Toggle failed: ${err.message}`);
    }
  };

  const handleRestoreDefaults = async () => {
    if (!confirm('Are you sure you want to restore the test catalog to standard default settings?')) {
      return;
    }
    setRestoring(true);
    try {
      await api('/tests/restore-defaults', { method: 'POST' });
      fetchTests();
    } catch (err: any) {
      alert(`Restore failed: ${err.message}`);
    } finally {
      setRestoring(false);
    }
  };

  const categories = ['all', ...Array.from(new Set(tests.map((t) => t.category)))];

  const filteredTests = tests.filter((t) => {
    const matchesCat = categoryFilter === 'all' || t.category === categoryFilter;
    const matchesSev = severityFilter === 'all' || t.severity === severityFilter;
    const matchesEnabled =
      enabledFilter === 'all' ||
      (enabledFilter === 'enabled' && t.enabled) ||
      (enabledFilter === 'disabled' && !t.enabled);
    const matchesSearch =
      !search ||
      t.id.toLowerCase().includes(search.toLowerCase()) ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.prompt.toLowerCase().includes(search.toLowerCase()) ||
      t.tags.toLowerCase().includes(search.toLowerCase());

    return matchesCat && matchesSev && matchesEnabled && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-1">
            <span>Scenario Repository</span>
            <span>•</span>
            <span>27 Standard Test Cases</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Attack Test Catalog</h1>
          <p className="text-sm text-slate-400 mt-1">
            Comprehensive catalog of deterministic test cases covering direct injection, secret disclosure, indirect payloads, and benign controls.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRestoreDefaults}
            disabled={restoring}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-medium transition-all"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${restoring ? 'animate-spin' : ''}`} />
            <span>Restore Defaults</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search scenarios by ID, name, prompt, or tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-cyan-500/60 capitalize"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === 'all' ? 'All Categories' : c}
              </option>
            ))}
          </select>

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

          {/* Enabled Filter */}
          <select
            value={enabledFilter}
            onChange={(e) => setEnabledFilter(e.target.value as any)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-cyan-500/60 capitalize"
          >
            <option value="all">All States</option>
            <option value="enabled">Enabled Only</option>
            <option value="disabled">Disabled Only</option>
          </select>
        </div>
      </div>

      {/* Catalog List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 animate-pulse">Loading test catalog...</div>
        ) : filteredTests.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">No test cases match the active filter criteria.</div>
        ) : (
          filteredTests.map((test) => {
            const isExpanded = expandedId === test.id;
            return (
              <div
                key={test.id}
                className={`rounded-xl border transition-all ${
                  test.enabled
                    ? 'bg-slate-900/70 border-slate-800/80 hover:border-slate-700'
                    : 'bg-slate-950/40 border-slate-800/40 opacity-60'
                }`}
              >
                <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : test.id)}
                    className="flex-1 cursor-pointer select-none space-y-1"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                        {test.id}
                      </span>
                      <h2 className="text-xs sm:text-sm font-bold text-white">{test.name}</h2>
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                          test.severity === 'critical'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : test.severity === 'high'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : test.severity === 'medium'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {test.severity}
                      </span>
                      {!test.is_attack && (
                        <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold uppercase border border-emerald-500/30">
                          Benign Check
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">{test.description}</p>
                  </div>

                  {/* Toggle Switch & Expand */}
                  <div className="flex items-center gap-3 shrink-0">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <span className="text-xs text-slate-400 font-medium">{test.enabled ? 'Enabled' : 'Disabled'}</span>
                      <input
                        type="checkbox"
                        checked={test.enabled}
                        onChange={() => handleToggle(test.id, test.enabled)}
                        className="sr-only"
                      />
                      <div
                        className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
                          test.enabled ? 'bg-cyan-500' : 'bg-slate-800'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                            test.enabled ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </div>
                    </label>

                    <button
                      onClick={() => setExpandedId(isExpanded ? null : test.id)}
                      className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                      title="Toggle scenario details"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-4 border-t border-slate-800/80 bg-slate-950/60 space-y-3 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1">
                        Test Attack Prompt
                      </span>
                      <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 font-mono text-[11px] whitespace-pre-wrap">
                        {test.prompt}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1">
                          Expected Secure Behavior
                        </span>
                        <p className="text-slate-300 text-[11px]">{test.expected_behavior}</p>
                      </div>

                      <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1">
                          Deterministic Evaluation Rule
                        </span>
                        <p className="text-cyan-300 text-[11px] font-mono">{test.evaluation_rule}</p>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-slate-300 text-[11px] flex items-start gap-2">
                      <Lightbulb className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-cyan-300 block mb-0.5">Remediation Architecture:</strong>
                        <span>{test.remediation}</span>
                      </div>
                    </div>

                    {test.tags && (
                      <div className="flex items-center gap-1.5 pt-1 text-[10px] text-slate-500">
                        <Tag className="w-3 h-3" />
                        <span>Tags: {test.tags}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
