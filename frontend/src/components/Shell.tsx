'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useEffect, useState, ReactNode } from 'react';
import { LayoutDashboard, ListFilter, Moon, Sun, ShieldCheck } from 'lucide-react';

const NAV = [
  { href: '/', label: '개요', icon: LayoutDashboard },
  { href: '/events', label: '로그 탐색', icon: ListFilter },
];

export function Shell({ title, children }: { title: string; children: ReactNode }) {
  const path = usePathname();
  return (
    <div className="flex min-h-screen">
      <aside className="w-60 shrink-0 hidden md:flex flex-col border-r border-slate-200 dark:border-white/10 bg-white dark:bg-[#10111a] md:sticky md:top-0 md:h-screen">
        <div className="h-16 flex items-center gap-2 px-5 border-b border-slate-200 dark:border-white/10">
          <div className="w-8 h-8 rounded-lg grid place-items-center text-white" style={{ background: 'linear-gradient(135deg,#7c5cff,#5b8cff)' }}>
            <ShieldCheck size={18} />
          </div>
          <div>
            <div className="font-bold leading-tight">SentinelView</div>
            <div className="text-[11px] text-slate-400">Suricata 보안 로그</div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1 text-sm">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = path === href;
            return (
              <Link key={href} href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg ${
                  active ? 'bg-violet-500/15 text-violet-500'
                         : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                }`}>
                <Icon size={18} />{label}
              </Link>
            );
          })}
        </nav>
        <div className="m-3 p-3 rounded-xl bg-gradient-to-br from-violet-500/15 to-blue-500/10 border border-white/10">
          <div className="text-xs text-slate-500">데이터 소스</div>
          <div className="text-sm font-medium mt-1">PostgreSQL · eve.json</div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 shrink-0 flex items-center gap-3 px-4 md:px-6 border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-[#10111a]/80 backdrop-blur sticky top-0 z-20">
          <h1 className="text-lg font-semibold">{title}</h1>
          <div className="ml-auto"><ThemeToggle /></div>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="w-9 h-9" />;
  const dark = resolvedTheme === 'dark';
  return (
    <button onClick={() => setTheme(dark ? 'light' : 'dark')} title="라이트/다크 전환"
      className="w-9 h-9 grid place-items-center rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10">
      {dark ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  );
}
