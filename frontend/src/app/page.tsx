'use client';

import { useState, useMemo } from 'react';
import { Shell } from '@/components/Shell';
import { Card, Kpi, Skeleton, Badge, Empty, Explain, SEV_COLOR, SEV_LABEL, ETYPE_COLOR, fmt, fmtTime } from '@/components/ui';
import { TimeSeries, Donut, BarRank } from '@/components/charts';
import { GUIDE } from '@/lib/guide';
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

  // 총 이벤트 추세선(실데이터만): 시계열을 시각 버킷별 합계로 환산
  const totalSpark = useMemo(() => {
    if (!ts.data?.length) return undefined;
    const m = new Map<string, number>();
    for (const p of ts.data) m.set(p.bucket, (m.get(p.bucket) ?? 0) + p.count);
    return Array.from(m.keys()).sort().map((k) => m.get(k)!);
  }, [ts.data]);

  // 위험도 도넛: 숫자(1·2·3) 대신 한글 라벨(높음·중간·낮음·정보)로 표시
  const sevDonut = useMemo(() => {
    const rows = o?.bySeverity ?? [];
    const lab = (k: string | null) => SEV_LABEL[String(k ?? '')] ?? `위험도 ${k}`;
    const data = rows.map((d) => ({ key: lab(d.key), count: d.count }));
    const colors: Record<string, string> = {};
    rows.forEach((d) => { colors[lab(d.key)] = SEV_COLOR[String(d.key ?? '')] ?? '#64748b'; });
    return { data, colors };
  }, [o]);

  // 프로토콜 도넛: 빈 값('(empty)')을 unknown 으로 합쳐 정리
  const protoDonut = useMemo(() => {
    if (!proto.data) return undefined;
    const m = new Map<string, number>();
    for (const d of proto.data) {
      const k = d.key && d.key.trim() ? d.key : 'unknown';
      m.set(k, (m.get(k) ?? 0) + d.count);
    }
    return Array.from(m, ([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count);
  }, [proto.data]);

  const chip = (on: boolean) =>
    `text-xs px-2.5 py-1 rounded-lg font-medium ${on ? 'bg-accent-600 text-white' : 'bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-slate-200 dark:hover:bg-white/10'}`;
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

      {/* 핵심 지표 */}
      <Explain lines={GUIDE.overview.kpi} label="이 숫자들은 무엇인가요?" />
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <Kpi label="총 이벤트" value={fmt(o?.totalEvents)} spark={totalSpark} />
        <Kpi label="경보" value={fmt(o?.alertCount)} accent="#dc2626" />
        <Kpi label="고유 출발지 IP" value={fmt(o?.distinctSrcIp)} />
        <Kpi label="이벤트 유형" value={fmt(o?.byEventType?.length)} />
      </div>

      {/* 추이 + 위험도 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mt-4">
        <Card title="이벤트 추이" sub="유형별 시간대 추이" help={GUIDE.overview.trend} className="xl:col-span-2">
          {ts.data ? <TimeSeries data={ts.data} /> : <Skeleton h="h-72" />}
        </Card>
        <Card title="위험도 분포" sub="경보 위험도 (높음이 가장 심각)" help={GUIDE.overview.severity}>
          {o ? <Donut data={sevDonut.data} colors={sevDonut.colors} /> : <Skeleton />}
        </Card>
      </div>

      {/* 프로토콜 + 시그니처 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mt-4">
        <Card title="프로토콜 비중" sub="통신 프로토콜별 비중" help={GUIDE.overview.protocol} className={staff ? '' : 'xl:col-span-3'}>
          {protoDonut ? <Donut data={protoDonut} colors={ETYPE_COLOR} /> : <Skeleton />}
        </Card>
        {staff && (
          <Card title="탐지 시그니처" sub="탐지 규칙별 발생 건수" help={GUIDE.overview.signature} className="xl:col-span-2">
            {sig.data ? <BarRank data={sig.data} /> : <Skeleton h="h-72" />}
          </Card>
        )}
      </div>

      {/* 공격 유형 + 대상 포트 */}
      {staff && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-4">
          <Card title="공격 유형" sub="공격 분류별 분포" help={GUIDE.overview.category}>
            {cat.data ? (cat.data.length ? <BarRank data={cat.data} color="#0891b2" /> : <Empty label="공격 유형 데이터가 없습니다" />) : <Skeleton h="h-72" />}
          </Card>
          <Card title="주요 대상 포트" sub="공격이 노린 서비스 포트" help={GUIDE.overview.ports}>
            {ports.data ? <BarRank data={ports.data} color="#ea580c" /> : <Skeleton h="h-72" />}
          </Card>
        </div>
      )}

      {/* 주요 통신 IP + 경보 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-4">
        {staff && (
          <Card title="주요 통신 IP" sub="출발지·목적지 IP 순위" help={GUIDE.overview.talkers}>
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

        <Card title="경보 모니터링" sub="위험도순 정렬 · 위험도 필터" help={GUIDE.overview.alerts} className={staff ? '' : 'xl:col-span-2'}>
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
