'use client';

import { useState, useEffect } from 'react';
import { Crosshair, Search } from 'lucide-react';
import { Shell } from '@/components/Shell';
import { Card, Kpi, Skeleton, SevBars, fmt } from '@/components/ui';
import { MiniBars } from '@/components/charts';
import { useIpProfile, useTalkers } from '@/lib/api';

export default function IpAnalysisPage() {
  const [ip, setIp] = useState('');
  const [input, setInput] = useState('');

  // 다른 페이지에서 ?ip=... 로 들어오면 자동 조회 (시그니처 분석 → IP 분석 연결)
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('ip');
    if (q) { setIp(q); setInput(q); }
  }, []);

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
          <Card title="위험도 분포" className="mt-4"><SevBars data={p.bySeverity} /></Card>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mt-4">
            <Card title="시그니처 Top" sub="이 IP가 유발한 탐지 룰 (클릭 → 시그니처 분석)">
              <MiniBars data={p.topSignatures} color="#f97316" maxH={280}
                hrefFor={(sig) => `/analysis/signature?sig=${encodeURIComponent(sig)}`} />
            </Card>
            <Card title="대상 포트 Top" sub="노린 목적지 포트"><MiniBars data={p.topPorts} color="#f59e0b" maxH={280} /></Card>
            <Card title="시간선" sub="시간대별 활동"><MiniBars data={p.timeline} color="#2563eb" maxH={280} /></Card>
          </div>
        </>
      )}
    </Shell>
  );
}
