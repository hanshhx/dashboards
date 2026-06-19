'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useEffect, useState, ReactNode } from 'react';
import { LayoutDashboard, ListFilter, Users, Moon, Sun, LogOut, Lock, Crosshair, Fingerprint, ScrollText, GraduationCap, PanelLeft } from 'lucide-react';
import { Brand } from './Brand';
import { Footer } from './Footer';
import { useAuth, hasRole, ROLE_LABEL, type Role } from '@/lib/auth';

const NAV: { href: string; label: string; icon: typeof LayoutDashboard; min: Role }[] = [
  { href: '/', label: '개요', icon: LayoutDashboard, min: 'GENERAL' },
  { href: '/learn', label: '학습하기', icon: GraduationCap, min: 'GENERAL' },
  { href: '/events', label: '로그 탐색', icon: ListFilter, min: 'STAFF' },
  { href: '/analysis/ip', label: 'IP 분석', icon: Crosshair, min: 'STAFF' },
  { href: '/analysis/signature', label: '시그니처 분석', icon: Fingerprint, min: 'STAFF' },
  { href: '/admin/users', label: '회원 관리', icon: Users, min: 'ADMIN' },
  { href: '/admin/audit', label: '감사 로그', icon: ScrollText, min: 'ADMIN' },
];

function FullScreen({ children }: { children: ReactNode }) {
  return <div className="min-h-screen grid place-items-center text-slate-400 text-sm">{children}</div>;
}

export function Shell({
  title,
  children,
  requireRole,
}: {
  title: string;
  children: ReactNode;
  requireRole?: Role;
}) {
  const path = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  // 사이드바 접기/펴기 — 저장된 값 우선, 없으면 모바일은 접힘·데스크톱은 펼침으로 시작.
  // Shell 은 인증 후 클라이언트에서만 렌더되므로 초기화에서 window 접근 안전(하이드레이션 불일치 없음).
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const s = localStorage.getItem('pb_sidebar_collapsed');
    return s === null ? window.innerWidth < 768 : s === '1';
  });
  const toggleSidebar = () =>
    setCollapsed((c) => {
      const n = !c;
      try { localStorage.setItem('pb_sidebar_collapsed', n ? '1' : '0'); } catch { /* ignore */ }
      return n;
    });
  const closeOnMobile = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) setCollapsed(true);
  };

  // 미인증 → 로그인으로
  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  if (loading) return <FullScreen>불러오는 중</FullScreen>;
  if (!user) return <FullScreen>로그인 페이지로 이동 중</FullScreen>;

  const denied = requireRole && !hasRole(user, requireRole);
  const nav = NAV.filter((n) => hasRole(user, n.min));

  return (
    <div className="flex min-h-screen">
      {/* 모바일: 사이드바 열렸을 때 뒤 배경(탭하면 닫힘) */}
      {!collapsed && (
        <div onClick={() => setCollapsed(true)} className="fixed inset-0 z-20 bg-black/40 md:hidden" aria-hidden="true" />
      )}

      {/* 사이드바(접기/펴기). 로고는 여기에 두지 않음 — 헤더에 고정해 접기와 무관하게 항상 보이게. */}
      <aside
        className={`${collapsed ? 'hidden' : 'flex'} fixed inset-y-0 left-0 z-30 w-60 shrink-0 flex-col border-r border-slate-200 dark:border-white/10 bg-white dark:bg-[#10111a] md:sticky md:top-0 md:h-screen`}
      >
        <nav className="flex-1 p-3 space-y-1 text-sm overflow-y-auto">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = href === '/' ? path === '/' : path.startsWith(href);
            return (
              <Link key={href} href={href} onClick={closeOnMobile} aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg ${
                  active ? 'bg-accent-600/10 text-accent-600 dark:text-accent-500'
                         : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                }`}>
                <Icon size={18} />{label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 shrink-0 flex items-center gap-3 px-3 md:px-6 border-b border-slate-200 dark:border-white/10 bg-white dark:bg-[#10111a] sticky top-0 z-20">
          <button onClick={toggleSidebar} title="사이드바 접기/펴기" aria-label="사이드바 접기/펴기"
            className="w-9 h-9 grid place-items-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10 shrink-0">
            <PanelLeft size={18} />
          </button>
          {/* 로고 — 헤더 고정(사이드바 접기와 무관) */}
          <Link href="/" className="shrink-0"><Brand /></Link>
          <span className="hidden md:block text-sm text-slate-400 border-l border-slate-200 dark:border-white/10 pl-3 truncate">{title}</span>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/profile" title="프로필 / 설정"
              className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10">
              <span className="text-sm font-medium">{user.username}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent-600/10 text-accent-600 dark:text-accent-500 font-semibold">{ROLE_LABEL[user.role]}</span>
            </Link>
            <ThemeToggle />
            <button onClick={() => { logout(); router.replace('/login'); }} title="로그아웃"
              className="w-9 h-9 grid place-items-center rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-red-500/10 hover:text-red-500">
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">
          {denied ? (
            <div className="grid place-items-center py-24 text-center">
              <Lock size={40} className="text-slate-300 dark:text-white/20 mb-3" />
              <div className="font-semibold">접근 권한이 없습니다</div>
              <div className="text-sm text-slate-400 mt-1">
                이 페이지는 <b>{ROLE_LABEL[requireRole!]}</b> 이상만 접근할 수 있습니다. (현재 등급: {ROLE_LABEL[user.role]})
              </div>
            </div>
          ) : children}
        </main>

        <Footer />
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
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
