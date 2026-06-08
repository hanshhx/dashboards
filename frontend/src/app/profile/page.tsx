'use client';

import { useState, FormEvent } from 'react';
import { User, KeyRound, CheckCircle2 } from 'lucide-react';
import { Shell } from '@/components/Shell';
import { Card, Spinner, fieldCls } from '@/components/ui';
import { useAuth, ROLE_LABEL } from '@/lib/auth';
import { send } from '@/lib/api';

export default function ProfilePage() {
  const { user } = useAuth();
  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');
  const [conf, setConf] = useState('');
  const [err, setErr] = useState('');
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErr('');
    setOk(false);
    if (next !== conf) { setErr('새 비밀번호가 일치하지 않습니다.'); return; }
    if (next.length < 8) { setErr('새 비밀번호는 8자 이상이어야 합니다.'); return; }
    setBusy(true);
    try {
      await send('POST', '/auth/password', { currentPassword: cur, newPassword: next });
      setOk(true);
      setCur(''); setNext(''); setConf('');
    } catch (e) {
      setErr(e instanceof Error ? e.message : '변경 실패');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell title="프로필 / 설정">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-3xl">
        <Card title="계정 정보">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full grid place-items-center bg-accent-600 text-white text-xl font-bold">
              {user?.username?.[0]?.toUpperCase() ?? <User size={22} />}
            </div>
            <div>
              <div className="font-semibold text-lg">{user?.username}</div>
              <span className="text-xs px-2 py-0.5 rounded bg-accent-600/10 text-accent-600 dark:text-accent-500 font-semibold">{user ? ROLE_LABEL[user.role] : ''}</span>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-4">등급 변경은 관리자에게 문의하세요. 테마(라이트/다크)는 우측 상단에서 전환할 수 있습니다.</p>
        </Card>

        <Card title="비밀번호 변경">
          <form onSubmit={submit} className="space-y-3">
            {err && <div className="text-sm rounded-lg bg-red-500/10 text-red-500 px-3 py-2">{err}</div>}
            {ok && <div className="flex items-center gap-2 text-sm rounded-lg bg-green-500/10 text-green-600 dark:text-green-400 px-3 py-2"><CheckCircle2 size={15} /> 변경되었습니다.</div>}
            <input type="password" value={cur} onChange={(e) => setCur(e.target.value)} placeholder="현재 비밀번호" className={fieldCls} />
            <input type="password" value={next} onChange={(e) => setNext(e.target.value)} placeholder="새 비밀번호 (8자 이상)" className={fieldCls} />
            <input type="password" value={conf} onChange={(e) => setConf(e.target.value)} placeholder="새 비밀번호 확인" className={fieldCls} />
            <button type="submit" disabled={busy || !cur || !next}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-accent-600 hover:bg-accent-700 text-white font-medium text-sm disabled:opacity-50">
              {busy ? <><Spinner size={15} /> 변경 중</> : <><KeyRound size={16} /> 비밀번호 변경</>}
            </button>
          </form>
        </Card>
      </div>
    </Shell>
  );
}
