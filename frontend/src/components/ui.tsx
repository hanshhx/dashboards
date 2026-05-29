import { ReactNode } from 'react';

export function Card({
  title, sub, children, className = '',
}: { title?: string; sub?: string; children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl bg-white dark:bg-[#15161f] border border-slate-200 dark:border-white/10 p-5 ${className}`}>
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

export function Kpi({ label, value, accent }: { label: string; value: ReactNode; accent?: string }) {
  return (
    <div className="rounded-2xl bg-white dark:bg-[#15161f] border border-slate-200 dark:border-white/10 p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-2xl font-bold mt-1" style={accent ? { color: accent } : undefined}>{value}</div>
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

// Suricata alert.severity: 1=가장 심각 … 색상 매핑
export const SEV_COLOR: Record<string, string> = {
  '1': '#ef4444', '2': '#f97316', '3': '#eab308', '4': '#3b82f6',
};
export const ETYPE_COLOR: Record<string, string> = {
  alert: '#ef4444', http: '#5b8cff', dns: '#22c55e', tls: '#a855f7',
  flow: '#64748b', fileinfo: '#06b6d4', stats: '#94a3b8', tcp: '#5b8cff', udp: '#22c55e',
};

export const fmt = (n?: number | null) => (n == null ? '—' : n.toLocaleString());
export const fmtTime = (iso?: string) =>
  iso ? new Date(iso).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—';
