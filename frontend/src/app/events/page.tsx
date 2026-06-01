'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Search, FileSearch } from 'lucide-react';
import { Shell } from '@/components/Shell';
import { Card, Skeleton, Badge, ETYPE_COLOR, fmt, fmtTime } from '@/components/ui';
import { PayloadModal } from '@/components/PayloadModal';
import { useEvents, useOverview, useEventsHistogram, useEventsTopSrc } from '@/lib/api';
import { useAuth, hasRole } from '@/lib/auth';
import type { CountItem } from '@/lib/types';

const SIZE = 50;

/** 시각별 로그 개수 — 가로 막대 (스크롤) */
function HistBars({ data }: { data: CountItem[] }) {
  if (data.length === 0) return <div className="py-8 text-center text-sm text-slate-400">데이터 없음</div>;
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span className="w-24 shrink-0 text-slate-500 tabular-nums">{(d.key ?? '').slice(5)}</span>
          <div className="flex-1 h-4 rounded bg-slate-100 dark:bg-white/5 overflow-hidden">
            <div className="h-full rounded bg-gradient-to-r from-violet-500 to-blue-500"
                 style={{ width: `${(d.count / max) * 100}%` }} />
          </div>
          <span className="w-12 shrink-0 text-right font-medium tabular-nums">{fmt(d.count)}</span>
        </div>
      ))}
    </div>
  );
}

/** Top 공격 출발지 IP 순위 */
function TopIpRank({ data }: { data: CountItem[] }) {
  if (data.length === 0) return <div className="py-8 text-center text-sm text-slate-400">데이터 없음</div>;
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <ol className="space-y-1.5">
      {data.map((d, i) => (
        <li key={i} className="flex items-center gap-3 text-sm">
          <span className={`w-5 text-center text-xs font-bold ${i < 3 ? 'text-violet-500' : 'text-slate-400'}`}>{i + 1}</span>
          <span className="w-36 shrink-0 font-mono text-xs truncate" title={d.key ?? ''}>{d.key ?? '—'}</span>
          <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden">
            <div className="h-full rounded-full bg-red-500/80" style={{ width: `${(d.count / max) * 100}%` }} />
          </div>
          <span className="w-12 shrink-0 text-right font-medium tabular-nums">{fmt(d.count)}</span>
        </li>
      ))}
    </ol>
  );
}

export default function EventsPage() {
  const [q, setQ] = useState('');
  const [ip, setIp] = useState('');
  const [eventType, setEventType] = useState('');
  const [page, setPage] = useState(0);
  const [showAll, setShowAll] = useState(false);          // 전체보기 토글
  const [payloadId, setPayloadId] = useState<number | null>(null); // payload 모달

  const { user } = useAuth();
  const admin = hasRole(user, 'ADMIN'); // payload 상세/다운로드는 관리자만

  const ov = useOverview();
  const etypes = ['', ...((ov.data?.byEventType ?? []).map((c) => c.key).filter(Boolean) as string[])];

  const filter = { eventType: eventType || undefined, ip: ip || undefined, q: q || undefined };
  const hist = useEventsHistogram(filter, 'hour');
  const topSrc = useEventsTopSrc(filter, 10);

  const { data, isLoading, isError } = useEvents({ ...filter, page, size: SIZE });
  const total = data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / SIZE));
  const reset = () => setPage(0);

  const inputCls =
    'px-3 py-2 rounded-lg bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 border border-slate-300 dark:border-white/15 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30 outline-none text-sm';

  return (
    <Shell title="로그 탐색" requireRole="STAFF">
      {/* ⑥ 검색·필터 */}
      <div className="rounded-2xl bg-white dark:bg-[#15161f] border border-slate-200 dark:border-white/10 p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => { setQ(e.target.value); reset(); }}
            placeholder="IP · 시그니처 · payload 검색"
            className={`${inputCls} w-full pl-9`} />
        </div>
        <input value={ip} onChange={(e) => { setIp(e.target.value); reset(); }}
          placeholder="IP 정확히 일치" className={`${inputCls} w-44`} />
        <select value={eventType} onChange={(e) => { setEventType(e.target.value); reset(); }}
          className="px-3 py-2 rounded-lg bg-white dark:bg-[#1c1d2a] text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-white/15 focus:border-violet-500 outline-none text-sm">
          {etypes.map((t) => <option key={t} value={t} className="bg-white dark:bg-[#1c1d2a]">{t || 'event_type 전체'}</option>)}
        </select>
        <span className="text-xs text-slate-400">{total.toLocaleString()} 건</span>
      </div>

      {/* 요약 박스 2개 */}
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="시각별 로그 개수" sub="시간대(시간별) 발생 건수 · 현재 필터 반영">
          {hist.data ? <HistBars data={hist.data} /> : <Skeleton h="h-64" />}
        </Card>
        <Card title="Top 10 공격 출발지 IP" sub="src_ip 기준 상위 · 현재 필터 반영">
          {topSrc.data ? <TopIpRank data={topSrc.data} /> : <Skeleton h="h-64" />}
        </Card>
      </div>

      {/* 전체보기 토글 */}
      <button onClick={() => setShowAll((v) => !v)}
        className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#15161f] hover:bg-slate-50 dark:hover:bg-white/[.03] text-sm font-medium">
        <FileSearch size={16} className="text-violet-500" />
        {showAll ? '로그 테이블 접기' : `전체 로그 보기 (${total.toLocaleString()}건)`}
        {showAll ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {/* 로그 테이블 (전체보기 시) */}
      {showAll && (
        <>
          <div className="mt-4 rounded-2xl bg-white dark:bg-[#15161f] border border-slate-200 dark:border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-slate-500 bg-slate-50 dark:bg-white/[.03]">
                  <tr>
                    <th className="px-4 py-3 font-medium">시각</th>
                    <th className="px-4 py-3 font-medium">유형</th>
                    <th className="px-4 py-3 font-medium">출발지 → 목적지</th>
                    <th className="px-4 py-3 font-medium">proto</th>
                    <th className="px-4 py-3 font-medium">시그니처</th>
                    <th className="px-4 py-3 font-medium text-right">상세</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {isLoading && <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400">불러오는 중…</td></tr>}
                  {isError && <tr><td colSpan={6} className="px-4 py-10 text-center text-red-500">백엔드 API 연결 실패</td></tr>}
                  {data?.items.map((ev) => (
                    <tr key={ev.id} className="hover:bg-slate-50 dark:hover:bg-white/[.03] align-top">
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{fmtTime(ev.timestamp)}</td>
                      <td className="px-4 py-3"><Badge text={ev.eventType} color={ETYPE_COLOR[ev.eventType] || '#64748b'} /></td>
                      <td className="px-4 py-3 font-mono text-xs whitespace-nowrap">
                        {ev.srcIp}:{ev.srcPort} <span className="text-slate-400">→</span> {ev.destIp}:{ev.destPort}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{ev.proto}</td>
                      <td className="px-4 py-3 max-w-[360px] truncate" title={ev.signature ?? ''}>
                        {ev.signature ?? <span className="text-slate-400">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {admin ? (
                          <button onClick={() => setPayloadId(ev.id)}
                            className="text-xs px-2.5 py-1 rounded-lg bg-violet-500/10 text-violet-500 hover:bg-violet-500/20 font-medium">
                            payload
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400">관리자 전용</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {data && data.items.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400">조건에 맞는 로그가 없습니다.</td></tr>
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
        </>
      )}

      {/* payload 상세 모달 */}
      <PayloadModal id={payloadId} onClose={() => setPayloadId(null)} />
    </Shell>
  );
}
