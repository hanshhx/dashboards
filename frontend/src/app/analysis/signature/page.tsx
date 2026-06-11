'use client';

import { useState, useEffect } from 'react';
import { Fingerprint } from 'lucide-react';
import { Shell } from '@/components/Shell';
import { Card, Kpi, Skeleton, SevBars, fmt } from '@/components/ui';
import { MiniBars } from '@/components/charts';
import { useSignatureProfile, useSignatures } from '@/lib/api';

export default function SignatureAnalysisPage() {
  const [sig, setSig] = useState('');

  // 다른 페이지에서 ?sig=... 로 들어오면 자동 조회 (IP 분석 → 시그니처 분석 연결)
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('sig');
    if (q) setSig(q);
  }, []);

  const list = useSignatures(50, true);
  const prof = useSignatureProfile(sig || null);
  const p = prof.data;

  return (
    <Shell title="시그니처 분석" requireRole="STAFF">
      <div className="rounded-xl bg-white dark:bg-[#15161f] border border-slate-200 dark:border-white/10 p-4 flex flex-wrap items-center gap-3">
        <Fingerprint size={18} className="text-accent-600 dark:text-accent-500" />
        <select value={sig} onChange={(e) => setSig(e.target.value)}
          className="flex-1 min-w-[280px] px-3 py-2 rounded-lg bg-white dark:bg-[#1c1d2a] text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-white/15 outline-none text-sm">
          <option value="">시그니처 선택 (상위 50)</option>
          {list.data?.map((s, i) => <option key={i} value={s.key ?? ''}>{s.key} ({fmt(s.count)}건)</option>)}
        </select>
      </div>

      {!sig && (
        <div className="grid place-items-center py-24 text-center text-slate-400">
          <Fingerprint size={40} className="mb-3 text-slate-300 dark:text-white/20" />
          분석할 시그니처를 선택하세요.
        </div>
      )}
      {sig && prof.isLoading && <div className="mt-4"><Skeleton h="h-40" /></div>}
      {sig && prof.isError && <div className="mt-4 text-red-500 text-sm">조회 실패</div>}

      {p && (
        <>
          <div className="mt-4 rounded-xl bg-white dark:bg-[#15161f] border border-slate-200 dark:border-white/10 p-4">
            <div className="text-xs text-slate-500">시그니처</div>
            <div className="font-semibold mt-0.5 break-all">{p.signature}</div>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-4">
            <Kpi label="총 발생 건수" value={fmt(p.total)} accent="#dc2626" />
            <Card title="위험도 분포"><SevBars data={p.bySeverity} /></Card>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mt-4">
            <Card title="유발 출발지 IP Top" sub="이 규칙을 가장 많이 유발한 IP (클릭 → IP 분석)">
              <MiniBars data={p.topSrcIps} color="#dc2626" maxH={280}
                hrefFor={(ip) => `/analysis/ip?ip=${encodeURIComponent(ip)}`} />
            </Card>
            <Card title="대상 포트 Top" sub="노린 목적지 포트"><MiniBars data={p.topPorts} color="#ea580c" maxH={280} /></Card>
            <Card title="시간선" sub="시간대별 발생"><MiniBars data={p.timeline} color="#2563eb" maxH={280} /></Card>
          </div>
        </>
      )}
    </Shell>
  );
}
