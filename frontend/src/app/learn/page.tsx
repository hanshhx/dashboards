'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CheckCircle2, Circle, Target, ExternalLink, Search, ListChecks, BookOpen } from 'lucide-react';
import { Shell } from '@/components/Shell';
import { LearnTabs } from '@/components/LearnTabs';
import { SEV_COLOR, SEV_LABEL } from '@/components/ui';
import { LearnArt, ART_CAPTION } from '@/components/learn-art';
import { LEARN_ITEMS, GROUPS, type LearnItem } from '@/lib/learn';

const STUN_SOURCES = [
  { label: 'Emerging Threats 공식 안내', url: 'https://community.emergingthreats.net/t/if-you-get-the-alert-et-info-session-traversal-utilities-for-nat-stun-binding-request/751' },
  { label: 'STUN — Wikipedia', url: 'https://en.wikipedia.org/wiki/STUN' },
  { label: 'RFC 5389', url: 'https://www.rfc-editor.org/rfc/rfc5389.html' },
  { label: 'RFC 8489', url: 'https://datatracker.ietf.org/doc/html/rfc8489' },
];

const LEVEL_COLOR: Record<LearnItem['level'], string> = { 입문: '#16a34a', 기초: '#2563eb', 심화: '#ea580c' };
const DONE_KEY = 'learn_done';

export default function LearnPage() {
  const [query, setQuery] = useState('');
  const [id, setId] = useState(LEARN_ITEMS[0].id);
  const [mode, setMode] = useState<'full' | 'summary'>('full');
  const [done, setDone] = useState<string[]>([]);

  // 진도 로드 + 퀴즈 오답에서 ?item= 으로 들어온 경우 해당 항목 열기
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DONE_KEY);
      if (raw) setDone(JSON.parse(raw));
    } catch { /* ignore */ }
    const q = new URLSearchParams(window.location.search).get('item');
    if (q && LEARN_ITEMS.some((i) => i.id === q)) setId(q);
  }, []);

  const item = LEARN_ITEMS.find((s) => s.id === id)!;
  const risk = item.riskKey ? { c: SEV_COLOR[item.riskKey], label: SEV_LABEL[item.riskKey] } : null;
  const isDone = done.includes(item.id);
  const pct = Math.round((done.length / LEARN_ITEMS.length) * 100);

  const toggleDone = () => {
    setDone((prev) => {
      const next = prev.includes(item.id) ? prev.filter((x) => x !== item.id) : [...prev, item.id];
      try { localStorage.setItem(DONE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  };

  const matches = (s: LearnItem) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return s.name.toLowerCase().includes(q)
      || (s.tag ?? '').toLowerCase().includes(q)
      || s.objective.toLowerCase().includes(q)
      || s.summary.some((x) => x.toLowerCase().includes(q))
      || (s.terms ?? []).some((t) => t.term.toLowerCase().includes(q) || t.def.toLowerCase().includes(q));
  };

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
        {/* 좌: 진도 + 검색 + 목록 */}
        <div className="space-y-3">
          {/* 진도율 */}
          <div>
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>학습 진도</span><span>{done.length} / {LEARN_ITEMS.length}</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden">
              <div className="h-full bg-accent-600 rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
          {/* 검색 */}
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="학습 항목·용어 검색"
              className="w-full pl-8 pr-3 py-2 rounded-lg bg-slate-100 dark:bg-white/10 border border-slate-300 dark:border-white/15 focus:border-accent-600 outline-none text-sm" />
          </div>
          {/* 목록 (그룹별, 권장 순서) */}
          {GROUPS.map((g) => {
            const items = LEARN_ITEMS.filter((s) => s.group === g && matches(s)).sort((a, b) => a.order - b.order);
            if (!items.length) return null;
            return (
              <div key={g} className="space-y-2">
                <div className="text-xs font-medium text-slate-500 px-1 pt-1">{g}</div>
                {items.map((s) => {
                  const on = s.id === id;
                  const sDone = done.includes(s.id);
                  const lc = LEVEL_COLOR[s.level];
                  return (
                    <button key={s.id} onClick={() => { setId(s.id); setMode('full'); }}
                      className={`w-full text-left rounded-xl border p-3 transition ${
                        on ? 'border-accent-600 bg-accent-600/5'
                           : 'border-slate-200 dark:border-white/10 bg-white dark:bg-[#15161f] hover:bg-slate-50 dark:hover:bg-white/5'
                      }`}>
                      <div className="flex items-center gap-2">
                        {sDone
                          ? <CheckCircle2 size={15} className="shrink-0 text-green-600 dark:text-green-500" />
                          : <Circle size={15} className="shrink-0 text-slate-300 dark:text-white/20" />}
                        <span className="flex-1 min-w-0 truncate text-sm font-medium">{s.name}</span>
                      </div>
                      <div className="mt-1.5 flex items-center gap-1.5 pl-[23px]">
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ background: `${lc}1a`, color: lc }}>{s.level}</span>
                        <span className="text-xs text-slate-500 truncate">{s.tag}{s.count ? ` · ${s.count.toLocaleString()}건` : ''}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* 우: 상세 */}
        <div className="rounded-xl bg-white dark:bg-[#15161f] border border-slate-200 dark:border-white/10 p-5">
          {/* 헤더 */}
          <div className="flex flex-wrap items-start gap-3 justify-between">
            <div className="min-w-0">
              <div className="font-semibold break-all leading-snug">{item.name}</div>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="text-[11px] px-2 py-0.5 rounded font-medium" style={{ background: `${LEVEL_COLOR[item.level]}1a`, color: LEVEL_COLOR[item.level] }}>{item.level}</span>
                {item.tag && <span className="text-[11px] px-2 py-0.5 rounded font-medium bg-slate-100 dark:bg-white/5 text-slate-500">{item.tag}</span>}
                {risk && <span className="text-[11px] px-2 py-0.5 rounded font-medium" style={{ background: `${risk.c}1a`, color: risk.c }}>위험도 {risk.label}</span>}
              </div>
            </div>
            <button onClick={toggleDone}
              className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg shrink-0 ${
                isDone ? 'bg-green-500/10 text-green-700 dark:text-green-400'
                       : 'border border-slate-200 dark:border-white/10 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10'
              }`}>
              {isDone ? <CheckCircle2 size={15} /> : <Circle size={15} />}{isDone ? '완료됨' : '완료로 표시'}
            </button>
          </div>

          {/* 학습 목표 */}
          <div className="mt-4 flex items-start gap-2.5 rounded-lg bg-accent-600/5 border border-accent-600/20 px-4 py-3">
            <Target size={18} className="mt-0.5 text-accent-600 dark:text-accent-500 shrink-0" />
            <div>
              <div className="text-xs font-medium text-accent-600 dark:text-accent-500 mb-0.5">학습 목표</div>
              <div className="text-sm text-slate-700 dark:text-slate-300">{item.objective}</div>
            </div>
          </div>

          {/* 전체/요약 토글 */}
          <div className="mt-4 flex justify-end">
            <div className="inline-flex rounded-lg border border-slate-200 dark:border-white/10 overflow-hidden text-sm">
              {toggleBtn('full', '전체')}
              {toggleBtn('summary', '요약')}
            </div>
          </div>

          {/* 본문 */}
          {mode === 'summary' ? (
            <ul className="mt-4 space-y-3">
              {item.summary.map((line, i) => (
                <li key={i} className="flex items-start gap-2.5 text-[15px] leading-7 text-slate-700 dark:text-slate-300">
                  <CheckCircle2 size={18} className="mt-1 shrink-0 text-accent-600 dark:text-accent-500" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-4 space-y-6">
              {item.blocks.map((b, i) => (
                <div key={i} className={i > 0 ? 'pt-6 border-t border-slate-100 dark:border-white/5' : ''}>
                  {b.art && (
                    <figure className="rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[.03] p-4">
                      <LearnArt art={b.art} />
                      <figcaption className="text-xs text-slate-400 mt-2 text-center">{ART_CAPTION[b.art]}</figcaption>
                    </figure>
                  )}
                  <p className={`${b.art ? 'mt-3 ' : ''}text-[15px] leading-7 text-slate-700 dark:text-slate-300`}>{b.text}</p>
                </div>
              ))}
            </div>
          )}

          {/* 직접 해보기 (딥링크) */}
          {item.deepLink && (
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link href={item.deepLink.href}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent-600 text-white text-sm font-medium hover:bg-accent-700">
                {item.deepLink.label}<ExternalLink size={15} />
              </Link>
              {item.deepLink.staff && <span className="text-xs text-slate-400">관계자 이상 권한이 필요합니다</span>}
            </div>
          )}

          {/* 실습 체크리스트 */}
          {item.practice && (
            <div className="mt-5 rounded-lg border border-slate-200 dark:border-white/10 p-4">
              <div className="flex items-center gap-2 text-sm font-medium mb-2"><ListChecks size={16} className="text-accent-600 dark:text-accent-500" /> 직접 해보기</div>
              <ul className="space-y-1.5">
                {item.practice.map((p, i) => (
                  <li key={i} className="flex gap-2 text-sm text-slate-600 dark:text-slate-300"><span className="text-slate-400">□</span><span>{p}</span></li>
                ))}
              </ul>
            </div>
          )}

          {/* 핵심 용어 */}
          {item.terms && (
            <div className="mt-5">
              <div className="flex items-center gap-2 text-sm font-medium mb-2"><BookOpen size={16} className="text-accent-600 dark:text-accent-500" /> 핵심 용어</div>
              <dl className="space-y-1.5">
                {item.terms.map((t) => (
                  <div key={t.term} className="text-sm leading-6">
                    <dt className="font-medium inline text-slate-800 dark:text-slate-200">{t.term}</dt>
                    <dd className="inline text-slate-600 dark:text-slate-300"> — {t.def}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {/* 출처 (STUN 한정 — 근거 표기) */}
          {item.id === 'stun' && (
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
