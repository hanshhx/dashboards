'use client';

import { useState } from 'react';
import { Shell } from '@/components/Shell';
import { Badge, ETYPE_COLOR, fmtTime } from '@/components/ui';
import { useEvents, useOverview } from '@/lib/api';

const SIZE = 50;

export default function EventsPage() {
  const [q, setQ] = useState('');
  const [ip, setIp] = useState('');
  const [eventType, setEventType] = useState('');
  const [page, setPage] = useState(0);

  const ov = useOverview();
  // 실제 데이터에 존재하는 event_type만 노출 (없는 유형으로 "데이터 없음" 뜨는 것 방지)
  const etypes = ['', ...((ov.data?.byEventType ?? []).map((c) => c.key).filter(Boolean) as string[])];

  const { data, isLoading, isError } = useEvents({
    q: q || undefined, ip: ip || undefined, eventType: eventType || undefined, page, size: SIZE,
  });
  const total = data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / SIZE));

  return (
    <Shell title="로그 탐색">
      {/* ⑥ 검색·필터 */}
      <div className="rounded-2xl bg-white dark:bg-[#15161f] border border-slate-200 dark:border-white/10 p-4 flex flex-wrap items-center gap-3">
        <input value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }}
          placeholder="IP · 시그니처 검색"
          className="flex-1 min-w-[200px] px-3 py-2 rounded-lg bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 border border-slate-300 dark:border-white/15 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30 outline-none text-sm" />
        <input value={ip} onChange={(e) => { setIp(e.target.value); setPage(0); }}
          placeholder="IP 정확히 일치"
          className="w-44 px-3 py-2 rounded-lg bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 border border-slate-300 dark:border-white/15 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30 outline-none text-sm" />
        <select value={eventType} onChange={(e) => { setEventType(e.target.value); setPage(0); }}
          className="px-3 py-2 rounded-lg bg-white dark:bg-[#1c1d2a] text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-white/15 focus:border-violet-500 outline-none text-sm">
          {etypes.map((t) => <option key={t} value={t} className="bg-white dark:bg-[#1c1d2a]">{t || 'event_type 전체'}</option>)}
        </select>
        <span className="text-xs text-slate-400">{total.toLocaleString()} 건</span>
      </div>

      {/* 로그 테이블 */}
      <div className="mt-4 rounded-2xl bg-white dark:bg-[#15161f] border border-slate-200 dark:border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-slate-500 bg-slate-50 dark:bg-white/[.03]">
              <tr>
                <th className="px-4 py-3 font-medium">시각</th>
                <th className="px-4 py-3 font-medium">유형</th>
                <th className="px-4 py-3 font-medium">출발지 → 목적지</th>
                <th className="px-4 py-3 font-medium">proto</th>
                <th className="px-4 py-3 font-medium">payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {isLoading && <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-400">불러오는 중…</td></tr>}
              {isError && <tr><td colSpan={5} className="px-4 py-10 text-center text-red-500">백엔드 API 연결 실패</td></tr>}
              {data?.items.map((ev) => (
                <tr key={ev.id} className="hover:bg-slate-50 dark:hover:bg-white/[.03] align-top">
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{fmtTime(ev.timestamp)}</td>
                  <td className="px-4 py-3"><Badge text={ev.eventType} color={ETYPE_COLOR[ev.eventType] || '#64748b'} /></td>
                  <td className="px-4 py-3 font-mono text-xs whitespace-nowrap">
                    {ev.srcIp}:{ev.srcPort} <span className="text-slate-400">→</span> {ev.destIp}:{ev.destPort}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{ev.proto}</td>
                  <td className="px-4 py-3 max-w-[360px] truncate text-slate-400 font-mono text-xs" title={ev.payloadJson}>{ev.payloadJson}</td>
                </tr>
              ))}
              {data && data.items.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-400">조건에 맞는 로그가 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 페이지네이션 */}
      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="text-slate-400">페이지 {page + 1} / {pages}</span>
        <div className="flex gap-2">
          <button disabled={page <= 0} onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-white/5">이전</button>
          <button disabled={page + 1 >= pages} onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-white/5">다음</button>
        </div>
      </div>
    </Shell>
  );
}
