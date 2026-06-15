'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts';
import type { TimePoint, CountItem } from '@/lib/types';
import { ETYPE_COLOR, CHART_PALETTE } from './ui';

function useAxis() {
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === 'dark';
  return {
    dark,
    grid: dark ? '#23263a' : '#eef1f6',
    tick: dark ? '#94a3b8' : '#64748b',
    tooltipBg: dark ? '#1b1d2a' : '#ffffff',
  };
}

/** 이벤트 추이 — 유형별 누적 영역 차트 */
const ETS_TOP = 8; // 개별 표시할 유형 수 (나머지는 '기타'로 합침)

export function TimeSeries({ data }: { data: TimePoint[] }) {
  const { grid, tick, tooltipBg } = useAxis();
  const { rows, keys } = useMemo(() => {
    if (!data?.length) return { rows: [], keys: [] as string[] };

    // 1) 유형별 총합으로 상위 ETS_TOP 만 개별 표시, 나머지는 '기타'로 묶는다.
    const totals = new Map<string, number>();
    for (const p of data) totals.set(p.eventType, (totals.get(p.eventType) ?? 0) + p.count);
    const top = Array.from(totals.entries()).sort((a, b) => b[1] - a[1]).slice(0, ETS_TOP).map(([k]) => k);
    const topSet = new Set(top);
    const keys = totals.size > top.length ? [...top, '기타'] : top;

    // 2) 버킷별 행을 만들되, 모든 key를 0으로 초기화해 누적 영역이 끊기지 않게 한다.
    const map = new Map<string, Record<string, number | string>>();
    for (const p of data) {
      let row = map.get(p.bucket);
      if (!row) {
        row = { _b: p.bucket, t: new Date(p.bucket).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit' }) };
        for (const k of keys) row[k] = 0;
        map.set(p.bucket, row);
      }
      const k = topSet.has(p.eventType) ? p.eventType : '기타';
      row[k] = (row[k] as number) + p.count;
    }
    // 3) 시간순 정렬 (bucket = ISO 문자열이라 사전식 정렬이 곧 시간순)
    const rows = Array.from(map.values()).sort((a, b) => String(a._b).localeCompare(String(b._b)));
    return { rows, keys };
  }, [data]);

  const colorFor = (k: string, i: number) => ETYPE_COLOR[k] || CHART_PALETTE[i % CHART_PALETTE.length];

  return (
    <ResponsiveContainer width="100%" height={288}>
      <AreaChart data={rows} margin={{ left: -12, right: 8, top: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={grid} />
        <XAxis dataKey="t" tick={{ fill: tick, fontSize: 11 }} minTickGap={40} />
        <YAxis tick={{ fill: tick, fontSize: 11 }} allowDecimals={false} />
        <Tooltip contentStyle={{ background: tooltipBg, border: `1px solid ${grid}`, borderRadius: 8, fontSize: 12 }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {keys.map((k, i) => (
          <Area key={k} type="monotone" dataKey={k} stackId="1" connectNulls
                stroke={colorFor(k, i)} fill={colorFor(k, i) + '55'} />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

/** 도넛 (심각도 분포 / 프로토콜 통계) */
export function Donut({ data, colors }: { data: CountItem[]; colors?: Record<string, string> }) {
  const { tooltipBg, grid } = useAxis();
  const palette = CHART_PALETTE;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={data} dataKey="count" nameKey="key" innerRadius="55%" outerRadius="80%" paddingAngle={2}>
          {data.map((d, i) => (
            <Cell key={i} fill={(d.key && colors?.[d.key]) || palette[i % palette.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={{ background: tooltipBg, border: `1px solid ${grid}`, borderRadius: 8, fontSize: 12 }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

/** 탐지 시그니처 — 가로 막대 차트 */
export function BarRank({ data, color = '#f97316' }: { data: CountItem[]; color?: string }) {
  const { grid, tick, tooltipBg } = useAxis();
  // 항목 수에 맞춰 높이를 늘려 라벨이 겹치지 않게
  const height = Math.max(220, data.length * 42 + 20);
  const trunc = (s: string | null) => {
    const v = s ?? '(없음)';
    return v.length > 34 ? v.slice(0, 33) + '…' : v;
  };
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={grid} horizontal={false} />
        <XAxis type="number" allowDecimals={false} tick={{ fill: tick, fontSize: 11 }} />
        <YAxis type="category" dataKey="key" width={230} interval={0}
               tick={{ fill: tick, fontSize: 11 }} tickFormatter={trunc} />
        <Tooltip contentStyle={{ background: tooltipBg, border: `1px solid ${grid}`, borderRadius: 8, fontSize: 12 }} cursor={{ fill: 'transparent' }} />
        <Bar dataKey="count" fill={color} radius={[0, 6, 6, 0]} barSize={18} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** 컴팩트 가로 막대 리스트 (스크롤) — 드릴다운/요약용 */
export function MiniBars({ data, color = '#2563eb', maxH = 240, hrefFor }: { data: CountItem[]; color?: string; maxH?: number; hrefFor?: (key: string) => string }) {
  if (!data.length) return <div className="py-6 text-center text-sm text-slate-400">표시할 데이터가 없습니다</div>;
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="space-y-1.5 overflow-y-auto pr-1" style={{ maxHeight: maxH }}>
      {data.map((d, i) => {
        const k = d.key;
        const inner = (
          <>
            <span className="w-32 shrink-0 truncate text-slate-500" title={k ?? ''}>{k ?? '-'}</span>
            <div className="flex-1 h-3.5 rounded bg-slate-100 dark:bg-white/5 overflow-hidden">
              <div className="h-full rounded" style={{ width: `${(d.count / max) * 100}%`, background: color }} />
            </div>
            <span className="w-14 shrink-0 text-right font-medium tabular-nums">{d.count.toLocaleString()}</span>
          </>
        );
        return k && hrefFor ? (
          <Link key={i} href={hrefFor(k)} title={`'${k}' 분석으로 이동`}
            className="flex items-center gap-2 text-xs rounded-md px-1 -mx-1 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
            {inner}
          </Link>
        ) : (
          <div key={i} className="flex items-center gap-2 text-xs">{inner}</div>
        );
      })}
    </div>
  );
}
