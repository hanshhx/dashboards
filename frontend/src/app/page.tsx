'use client';

import { useState } from 'react';
import { Shell } from '@/components/Shell';
import { Card, Kpi, Skeleton, Badge, SEV_COLOR, SEV_LABEL, ETYPE_COLOR, fmt, fmtTime } from '@/components/ui';
import { TimeSeries, Donut, BarRank } from '@/components/charts';
import { useAuth, hasRole } from '@/lib/auth';
import {
  useOverview, useTimeseries, useProtocols, useTalkers, useSignatures,
  useCategories, useTopPorts, useRecentAlerts,
} from '@/lib/api';

export default function OverviewPage() {
  const { user } = useAuth();
  const staff = hasRole(user, 'STAFF'); // 관계자+ 만 시그니처·Top Talkers·분류·포트 노출

  const [alertSort, setAlertSort] = useState<'recent' | 'severity'>('severity'); // 기본=위험순
  const [alertSev, setAlertSev] = useState<number | undefined>(undefined);

  const ov = useOverview();
  const ts = useTimeseries('hour');
  const proto = useProtocols();
  const talk = useTalkers('pair', 8, staff);
  const sig = useSignatures(8, staff);
  const cat = useCategories(8, staff);
  const ports = useTopPorts(8, staff);
  const alerts = useRecentAlerts(12, alertSort, alertSev);
  const o = ov.data;

  const chip = (on: boolean) =>
    `text-xs px-2.5 py-1 rounded-lg font-medium ${on ? 'bg-violet-500 text-white' : 'bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-slate-200 dark:hover:bg-white/10'}`;
  const SEVS: { v: number | undefined; l: string }[] = [
    { v: undefined, l: '전체' }, { v: 1, l: '높음' }, { v: 2, l: '중간' }, { v: 3, l: '낮음' },
  ];

  return (
    <Shell title="개요">
      {ov.isError && (
        <div className="mb-4 rounded-lg bg-red-500/10 text-red-500 text-sm px-4 py-3">
          백엔드 API에 연결할 수 없습니다. 백엔드 실행 상태와 DB 접속을 확인하세요.
        </div>
      )}

      {/* KPI */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <Kpi label="총 이벤트" value={fmt(o?.totalEvents)} />
        <Kpi label="Alert" value={fmt(o?.alertCount)} accent="#ef4444" />
        <Kpi label="고유 출발지 IP" value={fmt(o?.distinctSrcIp)} />
        <Kpi label="이벤트 유형 수" value={fmt(o?.byEventType?.length)} />
      </div>

      {/* ④ 시계열 + 심각도 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mt-4">
        <Card title="시계열 이벤트 추이" sub="event_type별 시간 추이" className="xl:col-span-2">
          {ts.data ? <TimeSeries data={ts.data} /> : <Skeleton h="h-72" />}
        </Card>
        <Card title="심각도 분포" sub="alert.severity (1=높음)">
          {o ? <Donut data={o.bySeverity} colors={SEV_COLOR} /> : <Skeleton />}
        </Card>
      </div>

      {/* ② 프로토콜 + ⑤ 시그니처(관계자+) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mt-4">
        <Card title="트래픽·프로토콜 통계" sub="payload app_proto 기반" className={staff ? '' : 'xl:col-span-3'}>
          {proto.data ? <Donut data={proto.data} colors={ETYPE_COLOR} /> : <Skeleton />}
        </Card>
        {staff && (
          <Card title="시그니처별 집계" sub="탐지 룰별 발생 건수" className="xl:col-span-2">
            {sig.data ? <BarRank data={sig.data} /> : <Skeleton h="h-72" />}
          </Card>
        )}
      </div>

      {/* 공격 분류 + 대상 포트 (관계자+, payload 차원 분석) */}
      {staff && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-4">
          <Card title="공격 분류" sub="alert.category(classtype)별 — event_type보다 풍부한 축">
            {cat.data ? (cat.data.length ? <BarRank data={cat.data} color="#06b6d4" /> : <div className="py-8 text-center text-sm text-slate-400">category 데이터 없음</div>) : <Skeleton h="h-72" />}
          </Card>
          <Card title="대상 포트 Top" sub="공격이 노린 목적지 포트(서비스)">
            {ports.data ? <BarRank data={ports.data} color="#f59e0b" /> : <Skeleton h="h-72" />}
          </Card>
        </div>
      )}

      {/* ③ Top Talkers(관계자+) + ① Alert */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-4">
        {staff && (
          <Card title="Top Talkers" sub="출발지 · 목적지 IP 순위">
            {talk.data ? (
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-slate-500">
                  <tr><th className="py-2 w-8">#</th><th className="py-2">출발지</th><th className="py-2">목적지</th><th className="py-2 text-right">건수</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {talk.data.map((t, i) => (
                    <tr key={i}>
                      <td className="py-2.5 text-slate-400">{i + 1}</td>
                      <td className="py-2.5 font-mono text-xs">{t.srcIp ?? '—'}</td>
                      <td className="py-2.5 font-mono text-xs">{t.destIp ?? '—'}</td>
                      <td className="py-2.5 text-right font-medium">{fmt(t.count)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <Skeleton />}
          </Card>
        )}

        <Card title="Alert 모니터링" sub="위험도 우선 정렬 · 심각도 필터" className={staff ? '' : 'xl:col-span-2'}>
          {/* 정렬/필터 컨트롤 */}
          <div className="flex items-center gap-1.5 mb-3 flex-wrap">
            <button onClick={() => setAlertSort('severity')} className={chip(alertSort === 'severity')}>위험순</button>
            <button onClick={() => setAlertSort('recent')} className={chip(alertSort === 'recent')}>최근순</button>
            <span className="mx-1 text-slate-300 dark:text-white/20">|</span>
            {SEVS.map((s) => (
              <button key={s.l} onClick={() => setAlertSev(s.v)} className={chip(alertSev === s.v)}>{s.l}</button>
            ))}
          </div>
          {alerts.data ? (
            <ul className="space-y-3 text-sm">
              {alerts.data.map((a) => {
                const c = SEV_COLOR[String(a.severity ?? '')] ?? '#64748b';
                return (
                  <li key={a.id} className="flex items-start gap-3 rounded-lg border-l-4 bg-slate-50 dark:bg-white/[.04] pl-3 pr-2 py-2" style={{ borderColor: c }}>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{a.signature ?? '(시그니처 없음)'}</span>
                        {a.severity != null && <Badge text={SEV_LABEL[String(a.severity)] ?? `sev ${a.severity}`} color={c} />}
                      </div>
                      <div className="text-xs text-slate-500 truncate font-mono">
                        {a.srcIp}:{a.srcPort} → {a.destIp}:{a.destPort}
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400 shrink-0">{fmtTime(a.timestamp)}</span>
                  </li>
                );
              })}
              {alerts.data.length === 0 && <li className="text-slate-400">해당 조건의 경보가 없습니다.</li>}
            </ul>
          ) : <Skeleton />}
        </Card>
      </div>
    </Shell>
  );
}
