'use client';

import { ScrollText } from 'lucide-react';
import { Shell } from '@/components/Shell';
import { useAudit } from '@/lib/api';

const ACTION: Record<string, { label: string; color: string }> = {
  LOGIN: { label: '로그인', color: '#22c55e' },
  ROLE_CHANGE: { label: '등급 변경', color: '#a855f7' },
  USER_DELETE: { label: '회원 삭제', color: '#ef4444' },
  PASSWORD_CHANGE: { label: '비번 변경', color: '#5b8cff' },
  PAYLOAD_VIEW: { label: 'payload 열람', color: '#f59e0b' },
};

export default function AuditPage() {
  const { data, isLoading, isError } = useAudit(200);

  return (
    <Shell title="감사 로그" requireRole="ADMIN">
      <div className="rounded-2xl bg-white dark:bg-[#15161f] border border-slate-200 dark:border-white/10 p-4 mb-4 flex items-center gap-3">
        <ScrollText size={18} className="text-violet-500" />
        <div className="text-sm">로그인 · 회원 등급 변경 · <b>payload 열람</b> 등 민감 행위 기록 (최근 200건). 누가 무엇을 봤는지 추적용.</div>
      </div>

      <div className="rounded-2xl bg-white dark:bg-[#15161f] border border-slate-200 dark:border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-slate-500 bg-slate-50 dark:bg-white/[.03]">
              <tr>
                <th className="px-4 py-3 font-medium">시각</th>
                <th className="px-4 py-3 font-medium">사용자</th>
                <th className="px-4 py-3 font-medium">행위</th>
                <th className="px-4 py-3 font-medium">상세</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {isLoading && <tr><td colSpan={4} className="px-4 py-10 text-center text-slate-400">불러오는 중…</td></tr>}
              {isError && <tr><td colSpan={4} className="px-4 py-10 text-center text-red-500">불러오지 못했습니다.</td></tr>}
              {data?.map((e) => {
                const a = ACTION[e.action] ?? { label: e.action, color: '#64748b' };
                return (
                  <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-white/[.03]">
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap font-mono text-xs">{e.at}</td>
                    <td className="px-4 py-3 font-medium">{e.username}</td>
                    <td className="px-4 py-3">
                      <span className="text-[11px] px-2 py-0.5 rounded font-medium" style={{ background: `${a.color}1a`, color: a.color }}>{a.label}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-xs">{e.detail}</td>
                  </tr>
                );
              })}
              {data && data.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-10 text-center text-slate-400">기록이 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Shell>
  );
}
