'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { CheckCircle2, Circle, Target, ExternalLink, Search, ListChecks, BookOpen, Lock, Trophy, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { Shell } from '@/components/Shell';
import { LearnTabs } from '@/components/LearnTabs';
import { SEV_COLOR, SEV_LABEL } from '@/components/ui';
import { LearnArt, ART_CAPTION } from '@/components/learn-art';
import { LEARN_ITEMS, STAGES, STAGE_DESC, type Stage, type LearnItem } from '@/lib/learn';
import { loadCleared, isUnlocked, loadDone, toggleDone as toggleDoneStore, markDoneOnce, pullProgress } from '@/lib/learn-progress';

const STUN_SOURCES = [
  { label: 'Emerging Threats 공식 안내', url: 'https://community.emergingthreats.net/t/if-you-get-the-alert-et-info-session-traversal-utilities-for-nat-stun-binding-request/751' },
  { label: 'STUN — Wikipedia', url: 'https://en.wikipedia.org/wiki/STUN' },
  { label: 'RFC 5389', url: 'https://www.rfc-editor.org/rfc/rfc5389.html' },
];

const STAGE_COLOR: Record<Stage, string> = { 입문: '#16a34a', 기초: '#2563eb', 심화: '#ea580c' };

// 전 항목을 단계 → 순서로 펼친 목록(이전/다음 이동용)
const ORDERED = [...LEARN_ITEMS].sort((a, b) => STAGES.indexOf(a.level) - STAGES.indexOf(b.level) || a.order - b.order);

export default function LearnPage() {
  const [query, setQuery] = useState('');
  const [id, setId] = useState(LEARN_ITEMS[0].id);
  const [mode, setMode] = useState<'full' | 'summary'>('full');
  const [done, setDone] = useState<string[]>([]);
  const [cleared, setCleared] = useState<Stage[]>([]);
  const [ready, setReady] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setDone(loadDone());
    setCleared(loadCleared());
    setReady(true);
    const q = new URLSearchParams(window.location.search).get('item');
    if (q && LEARN_ITEMS.some((i) => i.id === q)) setId(q);
    pullProgress().then(() => { setDone(loadDone()); setCleared(loadCleared()); });
  }, []);

  const item = LEARN_ITEMS.find((s) => s.id === id)!;
  const risk = item.riskKey ? { c: SEV_COLOR[item.riskKey], label: SEV_LABEL[item.riskKey] } : null;
  const isDone = done.includes(item.id);
  const itemUnlocked = isUnlocked(item.level, cleared);

  // 이전/다음 항목, 전체 진도율
  const ci = ORDERED.findIndex((s) => s.id === id);
  const prevItem = ci > 0 ? ORDERED[ci - 1] : null;
  const nextItem = ci < ORDERED.length - 1 ? ORDERED[ci + 1] : null;
  const nextUnlocked = nextItem ? isUnlocked(nextItem.level, cleared) : false;
  const doneInItems = LEARN_ITEMS.filter((s) => done.includes(s.id)).length;
  const pct = Math.round((doneInItems / LEARN_ITEMS.length) * 100);
  const allDone = doneInItems === LEARN_ITEMS.length;

  const toggleDone = () => setDone(toggleDoneStore(item.id));
  const go = (s: LearnItem) => {
    setId(s.id);
    setMode('full');
    try { window.history.replaceState(null, '', `/learn?item=${s.id}`); } catch { /* ignore */ }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 본문을 끝까지 스크롤하면(끝 지점이 화면에 ~1초 머무르면) 자동으로 '완료' 처리. 이미 완료면 동작 안 함.
  useEffect(() => {
    if (!ready || !itemUnlocked || done.includes(item.id)) return;
    const el = endRef.current;
    if (!el) return;
    let t: ReturnType<typeof setTimeout> | null = null;
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        t = setTimeout(() => setDone(markDoneOnce(item.id)), 900);
      } else if (t) { clearTimeout(t); t = null; }
    }, { threshold: 0.1 });
    io.observe(el);
    return () => { io.disconnect(); if (t) clearTimeout(t); };
  }, [ready, itemUnlocked, item.id, done, mode]);

  const matches = (s: LearnItem) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return s.name.toLowerCase().includes(q)
      || (s.tag ?? '').toLowerCase().includes(q)
      || s.objective.toLowerCase().includes(q)
      || s.summary.some((x) => x.toLowerCase().includes(q))
      || s.blocks.some((b) => b.text.toLowerCase().includes(q))
      || (s.terms ?? []).some((t) => t.term.toLowerCase().includes(q) || t.def.toLowerCase().includes(q));
  };

  const stageItems = (stage: Stage) =>
    LEARN_ITEMS.filter((s) => s.level === stage && matches(s)).sort((a, b) => a.order - b.order);
  const stageDoneCount = (stage: Stage) =>
    LEARN_ITEMS.filter((s) => s.level === stage && done.includes(s.id)).length;
  const stageTotal = (stage: Stage) => LEARN_ITEMS.filter((s) => s.level === stage).length;

  const toggleBtn = (m: 'full' | 'summary', label: string) => (
    <button onClick={() => setMode(m)}
      className={`px-3 py-1.5 ${mode === m ? 'bg-accent-600 text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10'}`}>
      {label}
    </button>
  );

  return (
    <Shell title="학습하기">
      <LearnTabs />

      {/* 전체 학습 진도 */}
      {ready && (
        <div className="mt-4 rounded-xl bg-white dark:bg-[#15161f] border border-slate-200 dark:border-white/10 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Trophy size={16} className={allDone ? 'text-amber-500' : 'text-slate-400'} />
              전체 학습 진도
            </div>
            <div className="text-sm text-slate-500">
              {doneInItems}/{LEARN_ITEMS.length} · {pct}%
              {allDone && <span className="ml-2 inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-semibold">완주</span>}
            </div>
          </div>
          <div className="mt-2.5 h-2 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: allDone ? '#f59e0b' : '#2563eb' }} />
          </div>
        </div>
      )}

      {/* 단계 진행 요약 */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {STAGES.map((stage, i) => {
          const unlocked = isUnlocked(stage, cleared);
          const clr = cleared.includes(stage);
          const c = STAGE_COLOR[stage];
          return (
            <div key={stage} className={`rounded-xl border p-3 ${unlocked ? 'bg-white dark:bg-[#15161f] border-slate-200 dark:border-white/10' : 'bg-slate-50 dark:bg-white/[.02] border-dashed border-slate-300 dark:border-white/10'}`}>
              <div className="flex items-center gap-2">
                <span className="grid place-items-center w-6 h-6 rounded-full text-white text-xs font-bold" style={{ background: unlocked ? c : '#94a3b8' }}>
                  {clr ? <Check size={14} /> : i + 1}
                </span>
                <span className="font-semibold text-sm" style={{ color: unlocked ? c : undefined }}>{stage}</span>
                {clr ? <Trophy size={14} className="text-amber-500 ml-auto" />
                  : !unlocked ? <Lock size={13} className="text-slate-400 ml-auto" /> : null}
              </div>
              <div className="text-[11px] text-slate-500 mt-1.5 leading-snug">{STAGE_DESC[stage]}</div>
              {ready && (
                <div className="text-[11px] mt-1.5 font-medium" style={{ color: unlocked ? c : '#94a3b8' }}>
                  {clr ? '클리어 완료' : unlocked ? `학습 ${stageDoneCount(stage)}/${stageTotal(stage)} · 퀴즈로 통과하기` : '이전 단계 통과 시 열림'}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4 mt-4">
        {/* 좌: 검색 + 단계별 목록 */}
        <div className="space-y-4">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="학습 항목·용어 검색"
              className="w-full pl-8 pr-3 py-2 rounded-lg bg-slate-100 dark:bg-white/10 border border-slate-300 dark:border-white/15 focus:border-accent-600 outline-none text-sm" />
          </div>

          {STAGES.map((stage) => {
            const unlocked = isUnlocked(stage, cleared);
            const items = stageItems(stage);
            const c = STAGE_COLOR[stage];
            const prev = STAGES[STAGES.indexOf(stage) - 1];
            return (
              <div key={stage} className="space-y-2">
                <div className="flex items-center gap-1.5 px-1">
                  <span className="text-xs font-semibold" style={{ color: c }}>{stage}</span>
                  {!unlocked && <Lock size={12} className="text-slate-400" />}
                </div>

                {!unlocked ? (
                  <div className="rounded-xl border border-dashed border-slate-300 dark:border-white/10 p-4 text-center">
                    <Lock size={18} className="mx-auto text-slate-400 mb-1.5" />
                    <div className="text-xs text-slate-500">‘{prev}’ 단계 퀴즈를 80% 이상 통과하면 열립니다.</div>
                    <Link href="/learn/quiz" className="inline-flex items-center gap-1 text-xs mt-2 text-accent-600 dark:text-accent-500 hover:underline">
                      {prev} 퀴즈 풀러 가기 <ChevronRight size={12} />
                    </Link>
                  </div>
                ) : items.length === 0 ? (
                  <div className="text-xs text-slate-400 px-1">검색 결과 없음</div>
                ) : (
                  items.map((s) => {
                    const on = s.id === id;
                    const sDone = done.includes(s.id);
                    return (
                      <button key={s.id} onClick={() => go(s)}
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
                          <span className="text-xs text-slate-500 truncate">{s.tag}{s.count ? ` · ${s.count.toLocaleString()}건` : ''}</span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            );
          })}
        </div>

        {/* 우: 상세 */}
        {!itemUnlocked ? (
          <div className="rounded-xl bg-white dark:bg-[#15161f] border border-slate-200 dark:border-white/10 p-10 grid place-items-center text-center">
            <Lock size={36} className="text-slate-300 dark:text-white/20 mb-3" />
            <div className="text-sm text-slate-500">이 항목은 아직 잠겨 있습니다. 이전 단계 퀴즈를 통과하세요.</div>
          </div>
        ) : (
        <div className="rounded-xl bg-white dark:bg-[#15161f] border border-slate-200 dark:border-white/10 p-5">
          <div className="flex flex-wrap items-start gap-3 justify-between">
            <div className="min-w-0">
              <div className="font-semibold break-all leading-snug">{item.name}</div>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="text-[11px] px-2 py-0.5 rounded font-medium" style={{ background: `${STAGE_COLOR[item.level]}1a`, color: STAGE_COLOR[item.level] }}>{item.level}</span>
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

          <div className="mt-4 flex items-start gap-2.5 rounded-lg bg-accent-600/5 border border-accent-600/20 px-4 py-3">
            <Target size={18} className="mt-0.5 text-accent-600 dark:text-accent-500 shrink-0" />
            <div>
              <div className="text-xs font-medium text-accent-600 dark:text-accent-500 mb-0.5">학습 목표</div>
              <div className="text-sm text-slate-700 dark:text-slate-300">{item.objective}</div>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <div className="inline-flex rounded-lg border border-slate-200 dark:border-white/10 overflow-hidden text-sm">
              {toggleBtn('full', '전체')}
              {toggleBtn('summary', '요약')}
            </div>
          </div>

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

          {item.deepLink && (
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link href={item.deepLink.href}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent-600 text-white text-sm font-medium hover:bg-accent-700">
                {item.deepLink.label}<ExternalLink size={15} />
              </Link>
              {item.deepLink.staff && <span className="text-xs text-slate-400">관계자 이상 권한이 필요합니다</span>}
            </div>
          )}

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

          {/* 단계 퀴즈로 유도 */}
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between gap-3 flex-wrap">
            <span className="text-xs text-slate-500">이 단계를 다 봤다면, 퀴즈 80%로 다음 단계를 열어 보세요.</span>
            <Link href="/learn/quiz" className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-accent-600 text-white font-medium hover:bg-accent-700">
              {item.level} 퀴즈 풀기 <ChevronRight size={14} />
            </Link>
          </div>

          {/* 이전 / 다음 항목 이동 */}
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/5 grid grid-cols-2 gap-3">
            {prevItem ? (
              <button onClick={() => go(prevItem)}
                className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-white/10 p-3 text-left hover:bg-slate-50 dark:hover:bg-white/5">
                <ChevronLeft size={18} className="shrink-0 text-slate-400" />
                <span className="min-w-0">
                  <span className="block text-[11px] text-slate-400">이전</span>
                  <span className="block text-sm font-medium truncate">{prevItem.name}</span>
                </span>
              </button>
            ) : <div />}
            {nextItem ? (
              nextUnlocked ? (
                <button onClick={() => go(nextItem)}
                  className="flex items-center justify-end gap-2 rounded-lg border border-slate-200 dark:border-white/10 p-3 text-right hover:bg-slate-50 dark:hover:bg-white/5">
                  <span className="min-w-0">
                    <span className="block text-[11px] text-slate-400">다음</span>
                    <span className="block text-sm font-medium truncate">{nextItem.name}</span>
                  </span>
                  <ChevronRight size={18} className="shrink-0 text-slate-400" />
                </button>
              ) : (
                <div className="flex items-center justify-end gap-2 rounded-lg border border-dashed border-slate-300 dark:border-white/10 p-3 text-right opacity-80">
                  <span className="min-w-0">
                    <span className="block text-[11px] text-slate-400">다음 단계</span>
                    <span className="block text-sm font-medium text-slate-400 truncate">퀴즈 통과 후 열림</span>
                  </span>
                  <Lock size={16} className="shrink-0 text-slate-400" />
                </div>
              )
            ) : <div />}
          </div>

          {/* 끝까지 읽으면 자동 완료되는 지점 */}
          <div ref={endRef} className="h-4" />
          {!isDone && <div className="mt-1 text-center text-[11px] text-slate-400">여기까지 읽으면 자동으로 완료로 표시됩니다</div>}
        </div>
        )}
      </div>
    </Shell>
  );
}
