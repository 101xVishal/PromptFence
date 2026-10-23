'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Play,
  ShieldAlert,
  ShieldCheck,
  CheckSquare,
  Square,
  AlertTriangle,
  Info,
  Filter,
} from 'lucide-react';
import { api, TestCase, Scan } from '../../../lib/api';
import { formatDate } from '../../../lib/date';

export default function NewScanPage() {
  const router = useRouter();
  const [tests, setTests] = useState<TestCase[]>([]);
  const [loadingTests, setLoadingTests] = useState(true);
  const [error, setError] = useState('');

  // Form State
  const [name, setName] = useState('Security Assessment Scan');
  const [targetId, setTargetId] = useState('demo-support');
  const [mode, setMode] = useState<'baseline' | 'protected'>('baseline');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [authorized, setAuthorized] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setName(`Security Assessment — ${formatDate(new Date())}`);
    api<TestCase[]>('/tests')
      .then((res) => {
        setTests(res || []);
        // Select all enabled tests by default
        const enabled = (res || []).filter((t) => t.enabled).map((t) => t.id);
        setSelectedIds(enabled);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoadingTests(false);
      });
  }, []);

  const categories = ['all', ...Array.from(new Set(tests.map((t) => t.category)))];

  const filteredTests = tests.filter((t) => {
    if (categoryFilter === 'all') return true;
    return t.category === categoryFilter;
  });

  const handleToggleSelectAll = () => {
    const visibleIds = filteredTests.map((t) => t.id);
    const allSelected = visibleIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const handleToggleId = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a name for this scan.');
      return;
    }
    if (selectedIds.length === 0) {
      setError('Please select at least one test case to execute.');
      return;
    }
    if (!authorized) {
      setError('Please check the authorization confirmation checkbox before proceeding.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await api<Scan>('/scans', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          target_id: targetId,
          mode,
          test_ids: selectedIds,
        }),
      });

      // Navigate to resulting scan details page
      router.push(`/scans/${res.id}`);
    } catch (err: any) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800/80 pb-5">
        <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-1">
          <span>Scan Orchestrator</span>
          <span>•</span>
          <span>Target Assessment</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Configure New Security Scan</h1>
        <p className="text-sm text-slate-400 mt-1">
          Select target application, security posture mode, and test scenarios to benchmark defensive capabilities.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Scan Name & Target */}
        <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800/80 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-500/20 text-cyan-400 flex items-center justify-center text-xs">1</span>
            <span>Target &amp; Identity</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Scan Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Target Chatbot</label>
              <select
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500/60"
              >
                <option value="demo-support">demo-support (Acme Customer Support AI)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Step 2: Testing Posture / Mode */}
        <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800/80 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-500/20 text-cyan-400 flex items-center justify-center text-xs">2</span>
            <span>Security Posture Mode</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Baseline Option */}
            <div
              onClick={() => setMode('baseline')}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                mode === 'baseline'
                  ? 'bg-rose-500/10 border-rose-500/50 shadow-md shadow-rose-500/10'
                  : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2.5 mb-2">
                <ShieldAlert className={`w-5 h-5 ${mode === 'baseline' ? 'text-rose-400' : 'text-slate-500'}`} />
                <span className="font-bold text-sm text-white">Baseline (Vulnerable Simulator)</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Executes tests against the unhardened simulator. Demonstrates synthetic secret disclosure and unauthorized action execution for baseline vulnerability metrics.
              </p>
            </div>

            {/* Protected Option */}
            <div
              onClick={() => setMode('protected')}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                mode === 'protected'
                  ? 'bg-emerald-500/10 border-emerald-500/50 shadow-md shadow-emerald-500/10'
                  : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2.5 mb-2">
                <ShieldCheck className={`w-5 h-5 ${mode === 'protected' ? 'text-emerald-400' : 'text-slate-500'}`} />
                <span className="font-bold text-sm text-white">Protected (Defenses Enabled)</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Enforces the 7-layer defense pipeline: input inspection, policy enforcement, capability allowlisting, secret redaction, and security event logging.
              </p>
            </div>
          </div>
        </div>

        {/* Step 3: Test Scenario Selection */}
        <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800/80 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-500/20 text-cyan-400 flex items-center justify-center text-xs">3</span>
              <span>Select Security Scenarios ({selectedIds.length} of {tests.length} chosen)</span>
            </h2>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleToggleSelectAll}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
              >
                Toggle Select All (Category)
              </button>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                type="button"
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1 rounded-lg text-xs capitalize whitespace-nowrap transition-colors ${
                  categoryFilter === cat
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 font-semibold'
                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Test Case Selection List */}
          <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
            {loadingTests ? (
              <div className="p-8 text-center text-xs text-slate-500">Loading catalog scenarios...</div>
            ) : (
              filteredTests.map((test) => {
                const isChecked = selectedIds.includes(test.id);
                return (
                  <div
                    key={test.id}
                    onClick={() => handleToggleId(test.id)}
                    className={`p-3 rounded-lg border text-xs cursor-pointer flex items-start gap-3 transition-colors ${
                      isChecked
                        ? 'bg-slate-800/60 border-slate-700 text-slate-200'
                        : 'bg-slate-950/40 border-slate-800/60 text-slate-500 opacity-60 hover:opacity-90'
                    }`}
                  >
                    <div className="pt-0.5 text-cyan-400">
                      {isChecked ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-slate-600" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-mono font-bold text-slate-200">{test.id}</span>
                        <span className="font-semibold text-white truncate">{test.name}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider ${
                            test.severity === 'critical'
                              ? 'bg-rose-500/20 text-rose-300'
                              : test.severity === 'high'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-blue-500/20 text-blue-300'
                          }`}
                        >
                          {test.severity}
                        </span>
                        {!test.is_attack && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold uppercase">
                            Benign
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 line-clamp-1">{test.description}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Step 4: Authorization Notice & Submit */}
        <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800/80 space-y-4">
          <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-3">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>Authorized Testing Scope Notice:</strong> PromptFence executes controlled evaluations exclusively against authorized demo targets containing synthetic credentials. It never scans third-party URLs or connects to privileged external infrastructure.
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={authorized}
              onChange={(e) => setAuthorized(e.target.checked)}
              className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-cyan-500 focus:ring-0 focus:ring-offset-0"
            />
            <span className="text-xs text-slate-300 font-medium">
              I confirm this scan is authorized and targeted exclusively at the built-in synthetic demo sandbox.
            </span>
          </label>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting || !authorized || selectedIds.length === 0}
              className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Play className={`w-4 h-4 fill-white ${submitting ? 'animate-spin' : ''}`} />
              <span>{submitting ? 'Executing Security Test Suite...' : 'Execute Automated Scan Now'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
