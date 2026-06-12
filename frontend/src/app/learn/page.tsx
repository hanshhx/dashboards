'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { GraduationCap, ListChecks, CheckCircle2, ExternalLink } from 'lucide-react';
import { Shell } from '@/components/Shell';
import { SEV_COLOR, SEV_LABEL, fmt } from '@/components/ui';
import { LearnArt, ART_CAPTION } from '@/components/learn-art';
import { LEARN_SIGS } from '@/lib/learn';

// 두 학습 페이지(설명/퀴즈) 공통 상단 탭
export function LearnTabs() {
  const path = usePathname();
  const tab = (href: string, label: string, Icon: typeof GraduationCap) => {
    const on = path === href;
    return (
      <Link href={href}
        className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium ${
          on ? 'bg-accent-600 text-white'
             : 'bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-slate-200 dark:hover:bg-white/10'
        }`}>
        <Icon size={16} />{label}
      </Link>
    );
  };
  return (
    <div className="flex gap-2">
      {tab('/learn', '시그니처 설명', GraduationCap)}
      {tab('/learn/quiz', '퀴즈', ListChecks)}
    </div>
  );
}

const STUN_SOURCES = [
  { label: 'Emerging Threats 공식 안내', url: 'https://community.emergingthreats.net/t/if-you-get-the-alert-et-info-session-traversal-utilities-for-nat-stun-binding-request/751' },
  { label: 'STUN — Wikipedia', url: 'https://en.wikipedia.org/wiki/STUN' },
  { label: 'RFC 5389', url: 'https://www.rfc-editor.org/rfc/rfc5389.html' },
  { label: 'RFC 8489', url: 'https://datatracker.ietf.org/doc/html/rfc8489' },
];

export default function LearnPage() {
  const [id, setId] = useState(LEARN_SIGS[0].id);
  const [mode, setMode] = useState<'full' | 'summary'>('full');
  const sig = LEARN_SIGS.find((s) => s.id === id)!;
  const c = SEV_COLOR[sig.riskKey];
  const riskLabel = SEV_LABEL[sig.riskKey];

  const toggleBtn = (m: 'full' | 'summary', label: string) => (
    <button onClick={() => setMode(m)}
      className={`px-3 py-1.5 ${mode === m ? 'bg-accent-600 text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10'}`}>
      {label}
    </button>
  );

  return (
    <Shell title="학습하기">
      <LearnTabs />

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4 mt-4">
        {/* 시그니처 목록 */}
        <div className="space-y-2">
          <div className="text-xs text-slate-500 px-1">탐지 시그니처 — 클릭해서 배우기</div>
          {LEARN_SIGS.map((s) => {
            const sc = SEV_COLOR[s.riskKey];
            const on = s.id === id;
            return (
              <button key={s.id} onClick={() => { setId(s.id); setMode('full'); }}
                className={`w-full text-left rounded-xl border p-3 transition ${
                  on ? 'border-accent-600 bg-accent-600/5'
                     : 'border-slate-200 dark:border-white/10 bg-white dark:bg-[#15161f] hover:bg-slate-50 dark:hover:bg-white/5'
                }`}>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: sc }} />
                  <span className="flex-1 min-w-0 truncate text-sm font-medium">{s.name}</span>
                </div>
                <div className="mt-1 text-xs text-slate-500 pl-4">{s.category} · {fmt(s.count)}건</div>
              </button>
            );
          })}
        </div>

        {/* 상세 설명 */}
        <div className="rounded-xl bg-white dark:bg-[#15161f] border border-slate-200 dark:border-white/10 p-5">
          {/* 헤더 */}
          <div className="flex flex-wrap items-start gap-3 justify-between">
            <div className="min-w-0">
              <div className="font-semibold break-all leading-snug">{sig.name}</div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[11px] px-2 py-0.5 rounded font-medium bg-slate-100 dark:bg-white/5 text-slate-500">{sig.category}</span>
                <span className="text-[11px] px-2 py-0.5 rounded font-medium" style={{ background: `${c}1a`, color: c }}>위험도 {riskLabel}</span>
              </div>
            </div>
            <div className="inline-flex rounded-lg border border-slate-200 dark:border-white/10 overflow-hidden text-sm shrink-0">
              {toggleBtn('full', '전체')}
              {toggleBtn('summary', '요약')}
            </div>
          </div>

          {/* 본문 */}
          {mode === 'summary' ? (
            <ul className="mt-5 space-y-3">
              {sig.summary.map((line, i) => (
                <li key={i} className="flex items-start gap-2.5 text-[15px] leading-7 text-slate-700 dark:text-slate-300">
                  <CheckCircle2 size={18} className="mt-1 shrink-0 text-accent-600 dark:text-accent-500" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-5 space-y-6">
              {sig.blocks.map((b, i) => (
                <div key={i} className={i > 0 ? 'pt-6 border-t border-slate-100 dark:border-white/5' : ''}>
                  <figure className="rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[.03] p-4">
                    <LearnArt art={b.art} />
                    <figcaption className="text-xs text-slate-400 mt-2 text-center">{ART_CAPTION[b.art]}</figcaption>
                  </figure>
                  <p className="mt-3 text-[15px] leading-7 text-slate-700 dark:text-slate-300">{b.text}</p>
                </div>
              ))}
            </div>
          )}

          {/* 출처 (STUN 한정 — 근거 표기) */}
          {sig.id === 'stun' && (
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/5">
              <div className="text-xs text-slate-500 mb-2">출처</div>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                {STUN_SOURCES.map((s) => (
                  <a key={s.url} href={s.url} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-accent-600 dark:text-accent-500 hover:underline">
                    {s.label}<ExternalLink size={11} />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}
