'use client';

import { useState } from 'react';
import { Crosshair, Search } from 'lucide-react';
import { Shell } from '@/components/Shell';
import { Card, Kpi, Skeleton, SEV_COLOR, SEV_LABEL, fmt } from '@/components/ui';
import { MiniBars } from '@/components/charts';
import { useIpProfile, useTalkers } from '@/lib/api';
import type { CountItem } from '@/lib/types';

function SevChips({ data }: { data: CountItem[] }) {
  if (!data?.length) return <span className="text-sm text-slate-400">표시할 데이터가 없습니다</span>;
  return (
    <div className="flex gap-2 flex-wrap">
      {data.map((d) => {
        const k = d.key ?? '';
        const c = SEV_COLOR[k] ?? '#64748b';
        return (
          <span key={k} className="text-xs px-3 py-1.5 rounded-lg font-medium" style={{ background: `${c}1a`, color: c }}>
            {SEV_LABEL[k] ?? `위험도 ${k}`}: {fmt(d.count)}
          </span>
        );
      })}
    </div>
  );
}

export default function IpAnalysisPage() {
  const [ip, setIp] = useState('');
  const [input, setInput] = useState('');
  const top = useTalkers('src', 30, true);
  const prof = useIpProfile(ip || null);
  const p = prof.data;

  const cls =
    'px-3 py-2 rounded-lg bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 border border-slate-300 dark:border-white/15 focus:border-accent-600 outline-none text-sm';

  return (
    <Shell title="IP 공격자 분석" requireRole="STAFF">
      <div className="rounded-xl bg-white dark:bg-[#15161f] border border-slate-200 dark:border-white/10 p-4 flex flex-wrap items-center gap-3">
        <Crosshair size={18} className="text-accent-600 dark:text-accent-500" />
        <select value={ip} onChange={(e) => setIp(e.target.value)}
          className="px-3 py-2 rounded-lg bg-white dark:bg-[#1c1d2a] text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-white/15 outline-none text-sm min-w-[240px]">
          <option value="">출발지 IP 선택 (상위 30)</option>
          {top.data?.map((t, i) => <option key={i} value={t.srcIp ?? ''}>{t.srcIp} ({fmt(t.count)}건)</option>)}
        </select>
        <span className="text-xs text-slate-400">또는</span>
        <input value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') setIp(input.trim()); }}
          placeholder="IP 직접 입력" className={`${cls} w-44`} />
        <button onClick={() => setIp(input.trim())}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-accent-600 hover:bg-accent-700 text-white text-sm font-medium">
          <Search size={15} /> 조회
        </button>
      </div>

      {!ip && (
        <div className="grid place-items-center py-24 text-center text-slate-400">
          <Crosshair size={40} className="mb-3 text-slate-300 dark:text-white/20" />
          분석할 IP를 선택하거나 입력하세요.
        </div>
      )}
      {ip && prof.isLoading && <div className="mt-4"><Skeleton h="h-40" /></div>}
      {ip && prof.isError && <div className="mt-4 text-red-500 text-sm">조회 실패</div>}

      {p && (
        <>
          <div className="grid grid-cols-3 gap-4 mt-4">
            <Kpi label={`이벤트 (${p.ip})`} value={fmt(p.total)} />
            <Kpi label="출발지로 (공격 시도)" value={fmt(p.asSrc)} accent="#ef4444" />
            <Kpi label="목적지로 (피격)" value={fmt(p.asDest)} />
          </div>
          <Card title="심각도 분포" className="mt-4"><SevChips data={p.bySeverity} /></Card>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mt-4">
            <Card title="시그니처 Top" sub="이 IP가 유발한 탐지 룰"><MiniBars data={p.topSignatures} color="#f97316" maxH={280} /></Card>
            <Card title="대상 포트 Top" sub="노린 목적지 포트"><MiniBars data={p.topPorts} color="#f59e0b" maxH={280} /></Card>
            <Card title="시간선" sub="시간대별 활동"><MiniBars data={p.timeline} color="#2563eb" maxH={280} /></Card>
          </div>
        </>
      )}
    </Shell>
  );
}
