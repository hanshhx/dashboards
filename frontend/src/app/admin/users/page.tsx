'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Trash2, Users as UsersIcon } from 'lucide-react';
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
  const [err, setErr] = useState('');

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

  async function remove(id: number, username: string) {
    if (!window.confirm(`'${username}' 계정을 삭제할까요? 되돌릴 수 없습니다.`)) return;
    setErr('');
    setBusyId(id);
    try {
      await send('DELETE', `/admin/users/${id}`);
      await qc.invalidateQueries({ queryKey: ['admin-users'] });
    } catch (e) {
      setErr(e instanceof Error ? e.message : '삭제 실패');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Shell title="회원 관리" requireRole="ADMIN">
      <div className="rounded-2xl bg-white dark:bg-[#15161f] border border-slate-200 dark:border-white/10 p-4 mb-4 flex items-center gap-3">
        <UsersIcon size={18} className="text-violet-500" />
        <div className="text-sm">
          <b>등급별 권한</b> — <b>일반</b>: 개요 요약만 / <b>관계자</b>: + 로그탐색·시그니처·Top IP / <b>관리자</b>: + payload 상세·다운로드·회원관리
        </div>
      </div>

      {err && <div className="mb-4 text-sm rounded-lg bg-red-500/10 text-red-500 px-4 py-2">{err}</div>}

      <div className="rounded-2xl bg-white dark:bg-[#15161f] border border-slate-200 dark:border-white/10 overflow-hidden">
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
              {isLoading && <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-400">불러오는 중…</td></tr>}
              {isError && <tr><td colSpan={5} className="px-4 py-10 text-center text-red-500">목록을 불러오지 못했습니다.</td></tr>}
              {data?.map((u) => {
                const isSelf = u.username === user?.username;
                return (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-white/[.03]">
                    <td className="px-4 py-3 text-slate-400">{u.id}</td>
                    <td className="px-4 py-3 font-medium">
                      {u.username}
                      {isSelf && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-500">나</span>}
                    </td>
                    <td className="px-4 py-3">
                      <select value={u.role} disabled={busyId === u.id || isSelf}
                        onChange={(e) => changeRole(u.id, e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#1c1d2a] text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-white/15 text-sm disabled:opacity-50">
                        {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]} ({r})</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{fmtTime(u.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => remove(u.id, u.username)} disabled={busyId === u.id || isSelf}
                        title={isSelf ? '본인은 삭제할 수 없습니다' : '삭제'}
                        className="inline-grid place-items-center w-8 h-8 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-500 disabled:opacity-30 disabled:hover:bg-transparent">
                        <Trash2 size={16} />
                      </button>
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
