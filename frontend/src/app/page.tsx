'use client';

import { Shell } from '@/components/Shell';
import { Card, Kpi, Skeleton, Badge, SEV_COLOR, SEV_LABEL, ETYPE_COLOR, fmt, fmtTime } from '@/components/ui';
import { TimeSeries, Donut, BarRank } from '@/components/charts';
import { useAuth, hasRole } from '@/lib/auth';
import {
  useOverview, useTimeseries, useProtocols, useTalkers, useSignatures, useRecentAlerts,
} from '@/lib/api';

export default function OverviewPage() {
  const { user } = useAuth();
  const staff = hasRole(user, 'STAFF'); // 관계자+ 만 시그니처·Top Talkers 노출

  const ov = useOverview();
  const ts = useTimeseries('hour');
  const proto = useProtocols();
  const talk = useTalkers('pair', 8, staff);
  const sig = useSignatures(8, staff);
  const alerts = useRecentAlerts(10);
  const o = ov.data;

  return (
    <Shell title="개요">
      {ov.isError && (
        <div className="mb-4 rounded-lg bg-red-500/10 text-red-500 text-sm px-4 py-3">
          백엔드 API에 연결할 수 없습니다. 백엔드 실행 상태와 DB 접속(pg_hba/방화벽)을 확인하세요.
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
        <Card title="심각도 분포" sub="alert.severity">
          {o ? <Donut data={o.bySeverity} colors={SEV_COLOR} /> : <Skeleton />}
        </Card>
      </div>

      {/* ② 프로토콜 + ⑤ 시그니처(관계자+) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mt-4">
        <Card title="트래픽·프로토콜 통계" sub="TCP·HTTP·DNS·TLS" className={staff ? '' : 'xl:col-span-3'}>
          {proto.data ? <Donut data={proto.data} colors={ETYPE_COLOR} /> : <Skeleton />}
        </Card>
        {staff && (
          <Card title="시그니처별 집계" sub="탐지 룰별 발생 건수" className="xl:col-span-2">
            {sig.data ? <BarRank data={sig.data} /> : <Skeleton h="h-72" />}
          </Card>
        )}
      </div>

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

        <Card title="Alert 모니터링" sub="최근 경보" className={staff ? '' : 'xl:col-span-2'}>
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
              {alerts.data.length === 0 && <li className="text-slate-400">경보가 없습니다.</li>}
            </ul>
          ) : <Skeleton />}
        </Card>
      </div>
    </Shell>
  );
}
