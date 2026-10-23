'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Terminal,
  Scan,
  PlusCircle,
  AlertTriangle,
  FileCode,
  ShieldCheck,
  GitCompare,
  FileText,
  Settings,
  Shield,
  Activity,
  Menu,
  X,
} from 'lucide-react';
import { api } from '../lib/api';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Sandbox', href: '/sandbox', icon: Terminal },
  { name: 'Security Scans', href: '/scans', icon: Scan },
  { name: 'New Scan', href: '/scans/new', icon: PlusCircle },
  { name: 'Findings', href: '/findings', icon: AlertTriangle },
  { name: 'Test Catalog', href: '/tests', icon: FileCode },
  { name: 'Defense Center', href: '/defenses', icon: ShieldCheck },
  { name: 'Comparison', href: '/comparison', icon: GitCompare },
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const checkHealth = () => {
      api<{ status: string }>('/health')
        .then(() => {
          if (isMounted) setApiConnected(true);
        })
        .catch(() => {
          if (isMounted) setApiConnected(false);
        });
    };

    checkHealth();
    const interval = setInterval(checkHealth, 20000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <>
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-[#0b1322] border-b border-slate-800 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-slate-950 font-black">
            <Shield className="w-5 h-5 text-slate-950 fill-slate-950" />
          </div>
          <span className="font-bold text-lg text-white tracking-tight">PromptFence</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Shell */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#0b1322] border-r border-slate-800/80 flex flex-col justify-between transition-transform duration-200 md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-5">
          {/* Logo Brand */}
          <Link href="/dashboard" className="flex items-center gap-3 mb-6 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-cyan-400 p-[1.5px] shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#0b1322] rounded-[10px] flex items-center justify-center">
                <Shield className="w-5 h-5 text-cyan-400 fill-cyan-400/20" />
              </div>
            </div>
            <div>
              <div className="font-extrabold text-base text-white tracking-tight">PromptFence</div>
              <div className="text-[11px] text-slate-400 font-medium">Security &amp; Defense</div>
            </div>
          </Link>

          {/* Target Workspace Badge */}
          <div className="mb-6 px-3 py-2 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Workspace:</span>
            <span className="text-cyan-400 font-semibold truncate max-w-[110px]">Local Sandbox</span>
          </div>

          {/* Quick Action Button */}
          <Link
            href="/scans/new"
            onClick={() => setMobileOpen(false)}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 mb-6 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-medium text-xs shadow-md shadow-blue-600/20 transition-all hover:shadow-cyan-500/20"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Launch New Scan</span>
          </Link>

          {/* Nav List */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600/15 text-cyan-400 border border-blue-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer with Backend Health Status */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  apiConnected === null
                    ? 'bg-amber-400 animate-pulse'
                    : apiConnected
                    ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]'
                    : 'bg-rose-500'
                }`}
              />
              <span className="font-mono text-[11px]">
                {apiConnected === null ? 'Connecting...' : apiConnected ? 'Backend Live' : 'API Offline'}
              </span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">v1.0.0</span>
          </div>
        </div>
      </aside>

      {/* Backdrop overlay for mobile */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm"
        />
      )}
    </>
  );
}
