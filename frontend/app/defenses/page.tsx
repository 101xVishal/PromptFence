'use client';

import { useEffect, useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  HelpCircle,
  Lock,
  Layers,
  Terminal,
} from 'lucide-react';
import { api, Defense } from '../../lib/api';

export default function DefensesPage() {
  const [defenses, setDefenses] = useState<Defense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchDefenses = () => {
    setLoading(true);
    setError('');
    api<Defense[]>('/defenses')
      .then((res) => {
        setDefenses(res || []);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDefenses();
  }, []);

  const handleToggle = async (id: string, currentEnabled: boolean) => {
    if (currentEnabled) {
      const confirmed = confirm(
        `Warning: Disabling this defense control may expose your application to security failures during protected-mode evaluations. Are you sure?`
      );
      if (!confirmed) return;
    }

    setTogglingId(id);
    try {
      const updated = await api<Defense>(`/defenses/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ enabled: !currentEnabled }),
      });
      setDefenses((prev) => prev.map((d) => (d.id === id ? { ...d, enabled: updated.enabled } : d)));
    } catch (err: any) {
      alert(`Defense toggle failed: ${err.message}`);
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="border-b border-slate-800/80 pb-5">
        <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-1">
          <span>Defense Pipeline</span>
          <span>•</span>
          <span>7 Protective Layers</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Defense Center</h1>
        <p className="text-sm text-slate-400 mt-1">
          Configure application guardrails, deterministic input/output filters, capability allowlisting, and telemetry logging.
        </p>
      </div>

      {/* Advisory Banner on Defense Limitations */}
      <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-slate-300 text-xs flex items-start gap-3">
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-cyan-300">Defense Architecture Notice:</strong> Deterministic keyword and regex filters alone cannot secure every generative AI model against novel semantic jailbreaks. PromptFence implements deterministic controls for benchmarking and demonstration, while highlighting the necessity of defense-in-depth and continuous automated testing.
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Defense Controls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {loading ? (
          [1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 rounded-xl bg-slate-900/60 border border-slate-800 animate-pulse" />
          ))
        ) : (
          defenses.map((d) => (
            <div
              key={d.id}
              className={`p-5 rounded-xl border flex flex-col justify-between transition-all ${
                d.enabled
                  ? 'bg-slate-900/70 border-slate-800/80 hover:border-slate-700'
                  : 'bg-slate-950/40 border-slate-800/40 opacity-70'
              }`}
            >
              <div className="space-y-3">
                {/* Card Header & Switch */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                        {d.category}
                      </span>
                      <h2 className="text-sm font-bold text-white">{d.name}</h2>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">id: {d.id}</span>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer select-none shrink-0">
                    <span className="text-xs font-semibold text-slate-400">
                      {d.enabled ? (
                        <span className="text-emerald-400">Active</span>
                      ) : (
                        <span className="text-slate-500">Disabled</span>
                      )}
                    </span>
                    <input
                      type="checkbox"
                      checked={d.enabled}
                      disabled={togglingId === d.id}
                      onChange={() => handleToggle(d.id, d.enabled)}
                      className="sr-only"
                    />
                    <div
                      className={`w-10 h-5 rounded-full p-0.5 transition-colors ${
                        d.enabled ? 'bg-cyan-500' : 'bg-slate-800'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                          d.enabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </div>
                  </label>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-300 leading-relaxed">{d.description}</p>

                {/* What it protects against */}
                <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 space-y-2 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                      Protects Against:
                    </span>
                    <span className="text-slate-200 text-[11px]">{d.protects_against}</span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-amber-500/80 tracking-wider block">
                      Inherent Limitations:
                    </span>
                    <span className="text-slate-400 text-[11px]">{d.limitations}</span>
                  </div>
                </div>
              </div>

              {/* Safe Example */}
              {d.safe_example && (
                <div className="mt-4 pt-3 border-t border-slate-800/60 text-xs text-slate-400">
                  <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider block mb-0.5">
                    Demonstration Behavior:
                  </span>
                  <span className="italic text-[11px]">&ldquo;{d.safe_example}&rdquo;</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
