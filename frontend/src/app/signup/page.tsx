'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, UserPlus, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';

export default function SignupPage() {
  const { signup } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [err, setErr] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErr('');
    if (password !== confirm) {
      setErr('비밀번호가 일치하지 않습니다.');
      return;
    }
    setBusy(true);
    try {
      await signup(username.trim(), password);
      setDone(true);
      setTimeout(() => router.replace('/login'), 1500);
    } catch (e) {
      setErr(e instanceof Error ? e.message : '회원가입 실패');
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

        {done ? (
          <div className="rounded-2xl bg-white dark:bg-[#15161f] border border-slate-200 dark:border-white/10 p-8 text-center shadow-xl">
            <CheckCircle2 size={40} className="text-green-500 mx-auto mb-3" />
            <div className="font-semibold">가입 완료!</div>
            <p className="text-sm text-slate-400 mt-1">로그인 페이지로 이동합니다… (기본 등급: 일반)</p>
          </div>
        ) : (
          <form onSubmit={submit} className="rounded-2xl bg-white dark:bg-[#15161f] border border-slate-200 dark:border-white/10 p-6 space-y-4 shadow-xl">
            <div>
              <h1 className="text-lg font-semibold">회원가입</h1>
              <p className="text-xs text-slate-400 mt-0.5">가입 후 관리자가 권한을 부여합니다</p>
            </div>

            {err && <div className="text-sm rounded-lg bg-red-500/10 text-red-500 px-3 py-2">{err}</div>}

            <div className="space-y-1.5">
              <label className="text-xs text-slate-500">아이디 <span className="text-slate-400">(영문/숫자/_ 3~20자)</span></label>
              <input value={username} onChange={(e) => setUsername(e.target.value)} autoFocus className={field} placeholder="아이디" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-slate-500">비밀번호 <span className="text-slate-400">(8자 이상)</span></label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={field} placeholder="비밀번호" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-slate-500">비밀번호 확인</label>
              <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={field} placeholder="비밀번호 확인" />
            </div>

            <button type="submit" disabled={busy || !username || password.length < 8}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-medium text-sm disabled:opacity-50">
              <UserPlus size={16} /> {busy ? '가입 중…' : '회원가입'}
            </button>

            <div className="text-center text-xs text-slate-400">
              이미 계정이 있으신가요? <Link href="/login" className="text-violet-500 font-medium hover:underline">로그인</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
