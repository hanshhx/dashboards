'use client';

import { useMemo } from 'react';
import { useTheme } from 'next-themes';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts';
import type { TimePoint, CountItem } from '@/lib/types';
import { ETYPE_COLOR } from './ui';

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

/** ④ 시계열 이벤트 추이 — event_type별 누적 영역 */
export function TimeSeries({ data }: { data: TimePoint[] }) {
  const { grid, tick, tooltipBg } = useAxis();
  const { rows, keys } = useMemo(() => {
    const map = new Map<string, Record<string, number | string>>();
    const ks = new Set<string>();
    for (const p of data) {
      ks.add(p.eventType);
      const label = new Date(p.bucket).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit' });
      const row = map.get(p.bucket) ?? { t: label };
      row[p.eventType] = ((row[p.eventType] as number) ?? 0) + p.count;
      map.set(p.bucket, row);
    }
    return { rows: Array.from(map.values()), keys: Array.from(ks) };
  }, [data]);

  return (
    <ResponsiveContainer width="100%" height={288}>
      <AreaChart data={rows} margin={{ left: -12, right: 8, top: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={grid} />
        <XAxis dataKey="t" tick={{ fill: tick, fontSize: 11 }} />
        <YAxis tick={{ fill: tick, fontSize: 11 }} />
        <Tooltip contentStyle={{ background: tooltipBg, border: `1px solid ${grid}`, borderRadius: 8, fontSize: 12 }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {keys.map((k) => (
          <Area key={k} type="monotone" dataKey={k} stackId="1"
                stroke={ETYPE_COLOR[k] || '#7c5cff'} fill={(ETYPE_COLOR[k] || '#7c5cff') + '55'} />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

/** 도넛 (심각도 분포 / 프로토콜 통계) */
export function Donut({ data, colors }: { data: CountItem[]; colors?: Record<string, string> }) {
  const { tooltipBg, grid } = useAxis();
  const palette = ['#7c5cff', '#5b8cff', '#22c55e', '#f59e0b', '#ef4444', '#a855f7', '#06b6d4'];
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

/** ⑤ 시그니처별 집계 — 가로 막대 */
export function BarRank({ data, color = '#f97316' }: { data: CountItem[]; color?: string }) {
  const { grid, tick, tooltipBg } = useAxis();
  return (
    <ResponsiveContainer width="100%" height={288}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={grid} horizontal={false} />
        <XAxis type="number" tick={{ fill: tick, fontSize: 11 }} />
        <YAxis type="category" dataKey="key" width={150} tick={{ fill: tick, fontSize: 11 }} />
        <Tooltip contentStyle={{ background: tooltipBg, border: `1px solid ${grid}`, borderRadius: 8, fontSize: 12 }} cursor={{ fill: 'transparent' }} />
        <Bar dataKey="count" fill={color} radius={[0, 6, 6, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
