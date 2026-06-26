'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogIn } from 'lucide-react';
import { Spinner, fieldCls } from '@/components/ui';
import { useAuth } from '@/lib/auth';

export default function LoginPage() {
  const { login, loginGuest, user, loading } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace('/');
  }, [loading, user, router]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      await login(username.trim(), password);
      router.replace('/');
    } catch (e) {
      setErr(e instanceof Error ? e.message : '로그인 실패');
    } finally {
      setBusy(false);
    }
  }

  // 게스트(시연) 모드 진입 — 비번 없이, 조회만 가능, 7일 후 만료.
  async function enterGuest() {
    setErr('');
    setBusy(true);
    try {
      await loginGuest();
      router.replace('/');
    } catch (e) {
      setErr(e instanceof Error ? e.message : '게스트 진입에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center p-4 bg-slate-50 dark:bg-[#0b0c14]">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-login.svg" alt="Packet Board" className="h-8 w-auto dark:brightness-0 dark:invert" />
        </div>

        <form onSubmit={submit} className="rounded-xl bg-white dark:bg-[#15161f] border border-slate-200 dark:border-white/10 p-6 space-y-4 shadow-xl">
          <div>
            <h1 className="text-lg font-semibold">로그인</h1>
            <p className="text-xs text-slate-400 mt-0.5">보안 로그 대시보드에 접속합니다</p>
          </div>

          {err && <div className="text-sm rounded-lg bg-red-500/10 text-red-500 px-3 py-2">{err}</div>}

          <div className="space-y-1.5">
            <label className="text-xs text-slate-500">아이디</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} autoFocus className={fieldCls} placeholder="아이디" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-slate-500">비밀번호</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={fieldCls} placeholder="비밀번호" />
          </div>

          <button type="submit" disabled={busy || !username || !password}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-accent-600 hover:bg-accent-700 text-white font-medium text-sm disabled:opacity-50">
            {busy ? <><Spinner size={15} /> 로그인 중</> : <><LogIn size={16} /> 로그인</>}
          </button>

          <div className="text-center text-xs text-slate-400">
            계정이 없으신가요? <Link href="/signup" className="text-accent-600 dark:text-accent-500 font-medium hover:underline">회원가입</Link>
          </div>
        </form>

        <div className="mt-3 text-center">
          <button type="button" onClick={enterGuest} disabled={busy}
            className="text-sm text-slate-500 hover:text-accent-600 dark:hover:text-accent-500 underline underline-offset-4 disabled:opacity-50">
            게스트로 둘러보기 (체험 · 7일)
          </button>
        </div>
      </div>
    </div>
  );
}
