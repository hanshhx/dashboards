'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, LogIn } from 'lucide-react';
import { useAuth } from '@/lib/auth';

export default function LoginPage() {
  const { login, user, loading } = useAuth();
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

  const field =
    'w-full px-3.5 py-2.5 rounded-lg bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 border border-slate-300 dark:border-white/15 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30 outline-none text-sm';

  return (
    <div className="min-h-screen grid place-items-center p-4 bg-slate-50 dark:bg-[#0b0c14]">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-xl grid place-items-center text-white" style={{ background: 'linear-gradient(135deg,#7c5cff,#5b8cff)' }}>
            <ShieldCheck size={22} />
          </div>
          <div className="text-xl font-bold">SentinelView</div>
        </div>

        <form onSubmit={submit} className="rounded-2xl bg-white dark:bg-[#15161f] border border-slate-200 dark:border-white/10 p-6 space-y-4 shadow-xl">
          <div>
            <h1 className="text-lg font-semibold">로그인</h1>
            <p className="text-xs text-slate-400 mt-0.5">보안 로그 대시보드에 접속합니다</p>
          </div>

          {err && <div className="text-sm rounded-lg bg-red-500/10 text-red-500 px-3 py-2">{err}</div>}

          <div className="space-y-1.5">
            <label className="text-xs text-slate-500">아이디</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} autoFocus className={field} placeholder="아이디" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-slate-500">비밀번호</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={field} placeholder="비밀번호" />
          </div>

          <button type="submit" disabled={busy || !username || !password}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-medium text-sm disabled:opacity-50">
            <LogIn size={16} /> {busy ? '로그인 중…' : '로그인'}
          </button>

          <div className="text-center text-xs text-slate-400">
            계정이 없으신가요? <Link href="/signup" className="text-violet-500 font-medium hover:underline">회원가입</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
