'use client';

import { useEffect, useState } from 'react';
import {
  Settings as SettingsIcon,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Shield,
  Key,
  Info,
  Activity,
  Trash2,
} from 'lucide-react';
import { api } from '../../lib/api';

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');

  // Editable fields
  const [chatbotName, setChatbotName] = useState('');
  const [publicFaq, setPublicFaq] = useState('');
  const [syntheticSecret, setSyntheticSecret] = useState('');
  const [apiHealth, setApiHealth] = useState<'checking' | 'healthy' | 'offline'>('checking');

  useEffect(() => {
    // Check API health
    api<{ status: string }>('/health')
      .then(() => setApiHealth('healthy'))
      .catch(() => setApiHealth('offline'));

    // Fetch settings
    api<Record<string, string>>('/settings')
      .then((res) => {
        setSettings(res || {});
        setChatbotName(res.chatbot_name || 'Acme Customer Support AI');
        setPublicFaq(res.public_faq || '');
        setSyntheticSecret(res.synthetic_secret || 'PF-DEMO-SECRET-8472');
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setError('');

    try {
      const updated = await api<Record<string, string>>('/settings', {
        method: 'PATCH',
        body: JSON.stringify({
          chatbot_name: chatbotName.trim(),
          public_faq: publicFaq.trim(),
          synthetic_secret: syntheticSecret.trim(),
        }),
      });
      setSettings(updated);
      setSuccessMsg('Settings updated and target configuration synchronized successfully.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleResetDemo = async () => {
    const confirmed = confirm(
      'Are you sure you want to reset all demo scan records, test results, and findings? Target and test catalog definitions will remain intact.'
    );
    if (!confirmed) return;

    setResetting(true);
    try {
      await api('/settings/reset-demo', { method: 'POST' });
      setSuccessMsg('Demo scan history and findings cleared successfully.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="border-b border-slate-800/80 pb-5">
        <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-1">
          <span>Platform Configuration</span>
          <span>•</span>
          <span>Environment Controls</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">System Settings</h1>
        <p className="text-sm text-slate-400 mt-1">
          Configure demo chatbot identity, synthetic secrets, public FAQ policies, and system diagnostics.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Backend Diagnostics Strip */}
      <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              apiHealth === 'healthy'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
            }`}
          >
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-2">
              <span>Backend API Status:</span>
              <span
                className={`font-mono text-[11px] px-2 py-0.5 rounded font-semibold ${
                  apiHealth === 'healthy'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-rose-500/20 text-rose-300'
                }`}
              >
                {apiHealth === 'healthy' ? 'ONLINE (FastAPI 0.115)' : 'OFFLINE'}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Database: SQLite 3 (promptfence.db) • Port: 8000</div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Zero external telemetry</span>
        </div>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800/80 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-cyan-400" />
            <span>Chatbot Target Configuration</span>
          </h2>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Chatbot Display Name</label>
              <input
                type="text"
                value={chatbotName}
                onChange={(e) => setChatbotName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Protected Synthetic Secret Token
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={syntheticSecret}
                  onChange={(e) => setSyntheticSecret(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-amber-300 font-mono focus:outline-none focus:border-amber-500/60"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Used in test scenarios SD-001, PI-001, and OUT-001 to evaluate sensitive disclosure and output redaction.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Public FAQ Knowledge Content
              </label>
              <textarea
                value={publicFaq}
                onChange={(e) => setPublicFaq(e.target.value)}
                rows={3}
                required
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Content supplied by the chatbot for legitimate customer inquiries regarding office hours and support.
              </p>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-md shadow-cyan-600/20 disabled:opacity-50 transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
            </button>
          </div>
        </div>

        {/* Local Privacy & Data Architecture Card */}
        <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800/80 space-y-3">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-400" />
            <span>Local Academic Privacy Architecture</span>
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            PromptFence is engineered strictly as a self-contained local demonstration platform. All simulated attacks, evaluations, and telemetry are executed directly on your workstation and stored in the local SQLite database. No prompts, secrets, or internal information are transmitted across the public Internet.
          </p>
        </div>

        {/* Danger Zone: Reset Demo Data */}
        <div className="p-5 rounded-xl bg-rose-500/5 border border-rose-500/20 space-y-3">
          <h2 className="text-sm font-bold text-rose-300 flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-rose-400" />
            <span>Demo State Reset</span>
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Clear all persisted scans, test results, findings, and security telemetry to restart evaluation from a clean state. Catalog definitions and target settings are preserved.
          </p>
          <div className="pt-1">
            <button
              type="button"
              onClick={handleResetDemo}
              disabled={resetting}
              className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors flex items-center gap-2"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
              <span>{resetting ? 'Resetting Demo Data...' : 'Reset All Scan Records & Findings'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
