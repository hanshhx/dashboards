'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { Shell } from '@/components/Shell';
import { useUsers, send } from '@/lib/api';
import { useAuth, ROLE_LABEL, type Role } from '@/lib/auth';
import { fmtTime } from '@/components/ui';

const ROLES: Role[] = ['GENERAL', 'STAFF', 'ADMIN'];

export default function AdminUsersPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data, isLoading, isError } = useUsers();
  const [busyId, setBusyId] = useState<number | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [err, setErr] = useState('');
  const [guestBusy, setGuestBusy] = useState(false);
  const [guestMsg, setGuestMsg] = useState('');

  async function changeRole(id: number, role: string) {
    setErr('');
    setBusyId(id);
    try {
      await send('PATCH', `/admin/users/${id}/role`, { role });
      await qc.invalidateQueries({ queryKey: ['admin-users'] });
    } catch (e) {
      setErr(e instanceof Error ? e.message : '변경 실패');
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: number) {
    setErr('');
    setBusyId(id);
    setConfirmId(null);
    try {
      await send('DELETE', `/admin/users/${id}`);
      await qc.invalidateQueries({ queryKey: ['admin-users'] });
    } catch (e) {
      setErr(e instanceof Error ? e.message : '삭제 실패');
    } finally {
      setBusyId(null);
    }
  }

  // 게스트 즉시 차단 / 재활성(+7일) — 시연 중 이상 징후 대응.
  async function guestAction(kind: 'block' | 'renew') {
    setGuestMsg('');
    setGuestBusy(true);
    try {
      await send('POST', `/admin/guest/${kind}`);
      await qc.invalidateQueries({ queryKey: ['admin-users'] });
      setGuestMsg(kind === 'block' ? '게스트를 즉시 차단했습니다.' : '게스트를 재활성하고 7일 연장했습니다.');
    } catch (e) {
      setGuestMsg(e instanceof Error ? e.message : '처리 실패');
    } finally {
      setGuestBusy(false);
    }
  }

  return (
    <Shell title="회원 관리" requireRole="ADMIN">
      <div className="rounded-xl bg-white dark:bg-[#15161f] border border-slate-200 dark:border-white/10 p-4 mb-4 text-sm">
        <b>등급별 권한</b> · <b>일반</b>: 개요 요약 / <b>관계자</b>: + 로그 탐색·시그니처·출발지 IP / <b>관리자</b>: + 원문 상세·다운로드·회원 관리
      </div>

      <div className="rounded-xl bg-white dark:bg-[#15161f] border border-slate-200 dark:border-white/10 p-4 mb-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="text-sm">
            <b>게스트(시연) 모드</b> · 조회만 가능 · 관리 기능 차단 · 7일 후 자동 만료. 이상 징후가 보이면 즉시 차단하세요.
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => guestAction('block')} disabled={guestBusy}
              className="text-sm px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 font-medium disabled:opacity-50">즉시 차단</button>
            <button onClick={() => guestAction('renew')} disabled={guestBusy}
              className="text-sm px-3 py-1.5 rounded-lg bg-accent-600/10 text-accent-600 dark:text-accent-500 hover:bg-accent-600/20 font-medium disabled:opacity-50">재활성 · 7일 연장</button>
          </div>
        </div>
        {guestMsg && <div className="mt-2 text-xs text-slate-500">{guestMsg}</div>}
      </div>

      {err && <div className="mb-4 text-sm rounded-lg bg-red-500/10 text-red-500 px-4 py-2">{err}</div>}

      <div className="rounded-xl bg-white dark:bg-[#15161f] border border-slate-200 dark:border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-slate-500 bg-slate-50 dark:bg-white/[.03]">
              <tr>
                <th className="px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">아이디</th>
                <th className="px-4 py-3 font-medium">등급</th>
                <th className="px-4 py-3 font-medium">가입일</th>
                <th className="px-4 py-3 font-medium text-right">삭제</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {isLoading && <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-400">불러오는 중</td></tr>}
              {isError && <tr><td colSpan={5} className="px-4 py-10 text-center text-red-500">목록을 불러오지 못했습니다.</td></tr>}
              {data?.map((u) => {
                const isSelf = u.username === user?.username;
                return (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-white/[.03]">
                    <td className="px-4 py-3 text-slate-400">{u.id}</td>
                    <td className="px-4 py-3 font-medium">
                      {u.username}
                      {isSelf && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-500">나</span>}
                      {u.role === 'GUEST' && (
                        <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded ${u.enabled ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/15 text-red-500'}`}>
                          {u.enabled ? '활성' : '차단됨'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {u.role === 'GUEST' ? (
                        <span className="text-xs px-2 py-1 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 font-medium">게스트(체험)</span>
                      ) : (
                        <select value={u.role} disabled={busyId === u.id || isSelf}
                          onChange={(e) => changeRole(u.id, e.target.value)}
                          className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#1c1d2a] text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-white/15 text-sm disabled:opacity-50">
                          {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{fmtTime(u.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      {confirmId === u.id ? (
                        <span className="inline-flex items-center gap-1.5">
                          <span className="text-xs text-slate-500">삭제할까요?</span>
                          <button onClick={() => remove(u.id)} disabled={busyId === u.id}
                            className="text-xs px-2 py-1 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 font-medium disabled:opacity-50">삭제</button>
                          <button onClick={() => setConfirmId(null)}
                            className="text-xs px-2 py-1 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10">취소</button>
                        </span>
                      ) : (
                        <button onClick={() => setConfirmId(u.id)} disabled={busyId === u.id || isSelf || u.role === 'GUEST'}
                          title={isSelf ? '본인은 삭제할 수 없습니다' : u.role === 'GUEST' ? '게스트는 위 카드에서 차단/갱신하세요' : '삭제'}
                          className="inline-grid place-items-center w-8 h-8 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-500 disabled:opacity-30 disabled:hover:bg-transparent">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {data && data.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-400">회원이 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Shell>
  );
}
