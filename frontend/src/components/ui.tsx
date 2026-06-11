import { ReactNode } from 'react';
import type { CountItem } from '@/lib/types';

/* ────────────────────────────────────────────────────────────
   색 토큰 — 앱 전체 색은 여기 한 곳에서만 정의한다.
   (브랜드 강조색은 tailwind.config.ts 의 accent)
   ──────────────────────────────────────────────────────────── */

// 경보 위험도(Suricata severity 1=가장 심각). 정보(4)는 의미상 중립색.
export const SEV_COLOR: Record<string, string> = {
  '1': '#dc2626', '2': '#ea580c', '3': '#ca8a04', '4': '#64748b',
};
export const SEV_LABEL: Record<string, string> = {
  '1': '높음', '2': '중간', '3': '낮음', '4': '정보',
};

// 이벤트/프로토콜 색. 경보=위험색과 통일, 나머지는 차분한 계열.
export const ETYPE_COLOR: Record<string, string> = {
  alert: '#dc2626', anomaly: '#ea580c', http: '#2563eb', dns: '#16a34a',
  tls: '#0891b2', flow: '#64748b', fileinfo: '#0d9488', stats: '#94a3b8',
  tcp: '#2563eb', udp: '#16a34a',
};

// 차트 공용 팔레트(브랜드 블루 우선, 보라 계열 배제).
export const CHART_PALETTE = ['#2563eb', '#0891b2', '#16a34a', '#ca8a04', '#ea580c', '#dc2626', '#64748b'];

/* ── 공용 컴포넌트 ── */

export function Card({
  title, sub, children, className = '',
}: { title?: string; sub?: string; children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl bg-white dark:bg-[#15161f] border border-slate-200 dark:border-white/10 p-5 ${className}`}>
      {title && (
        <div className="mb-3">
          <h3 className="font-semibold">{title}</h3>
          {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
        </div>
      )}
      {children}
    </div>
  );
}

// 실제 데이터로만 그리는 미니 추세선(없으면 렌더 안 함 — 가짜 데이터 금지).
function Spark({ data, color = '#2563eb' }: { data: number[]; color?: string }) {
  if (!data || data.length < 2) return null;
  const w = 90, h = 26;
  const max = Math.max(...data), min = Math.min(...data), span = max - min || 1;
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / span) * (h - 2) - 1}`)
    .join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden>
      <polyline points={pts} fill="none" stroke={color} strokeOpacity={0.85}
        strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export function Kpi({
  label, value, accent, spark,
}: { label: string; value: ReactNode; accent?: string; spark?: number[] }) {
  return (
    <div className="rounded-xl bg-white dark:bg-[#15161f] border border-slate-200 dark:border-white/10 p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="flex items-end justify-between gap-3">
        <div className="text-2xl font-bold mt-1" style={accent ? { color: accent } : undefined}>{value}</div>
        {spark && <Spark data={spark} color={accent ?? '#2563eb'} />}
      </div>
    </div>
  );
}

export function Skeleton({ h = 'h-64' }: { h?: string }) {
  return <div className={`${h} animate-pulse rounded-lg bg-slate-100 dark:bg-white/5`} />;
}

export function Badge({ text, color }: { text: string; color: string }) {
  return (
    <span className="text-[10px] uppercase px-2 py-0.5 rounded font-medium" style={{ background: `${color}1a`, color }}>
      {text}
    </span>
  );
}

// 빈 상태 / 로딩 — 문구·형식 통일.
export function Empty({ label = '표시할 데이터가 없습니다' }: { label?: string }) {
  return <div className="py-8 text-center text-sm text-slate-400">{label}</div>;
}

// 위험도 분포 — 위험도(1=높음)별 색 구분 막대. 한 등급만 있어도, 여러 등급이어도 동일하게 표시.
export function SevBars({ data }: { data: CountItem[] }) {
  if (!data?.length) return <Empty label="위험도 데이터가 없습니다" />;
  const rows = [...data].sort((a, b) => (a.key ?? '').localeCompare(b.key ?? ''));
  const max = Math.max(...rows.map((d) => d.count), 1);
  return (
    <div className="space-y-2">
      {rows.map((d) => {
        const k = d.key ?? '';
        const c = SEV_COLOR[k] ?? '#64748b';
        return (
          <div key={k} className="flex items-center gap-2 text-xs">
            <span className="w-10 shrink-0 font-medium" style={{ color: c }}>{SEV_LABEL[k] ?? `위험도 ${k}`}</span>
            <div className="flex-1 h-3.5 rounded bg-slate-100 dark:bg-white/5 overflow-hidden">
              <div className="h-full rounded" style={{ width: `${(d.count / max) * 100}%`, background: c }} />
            </div>
            <span className="w-12 shrink-0 text-right font-medium tabular-nums">{d.count.toLocaleString()}</span>
          </div>
        );
      })}
    </div>
  );
}

export function Spinner({ size = 16 }: { size?: number }) {
  return (
    <span
      className="inline-block animate-spin rounded-full border-2 border-slate-300 border-t-transparent dark:border-white/40 dark:border-t-transparent"
      style={{ width: size, height: size }}
      aria-hidden
    />
  );
}

export function Loading({ label = '불러오는 중' }: { label?: string }) {
  return (
    <div className="py-8 flex items-center justify-center gap-2 text-sm text-slate-400">
      <Spinner /> {label}
    </div>
  );
}

// 공용 입력 스타일(포커스=브랜드색). 로그인/가입/프로필/검색 입력이 공유.
export const fieldCls =
  'w-full px-3.5 py-2.5 rounded-lg bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 border border-slate-300 dark:border-white/15 focus:border-accent-600 focus:ring-2 focus:ring-accent-600/30 outline-none text-sm';

export const fmt = (n?: number | null) => (n == null ? '-' : n.toLocaleString());
export const fmtTime = (iso?: string) =>
  iso ? new Date(iso).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '-';
