'use client';

import { useState } from 'react';
import Link from 'next/link';
import { RotateCcw, ArrowRight } from 'lucide-react';
import { Shell } from '@/components/Shell';
import { LearnTabs } from '@/components/LearnTabs';
import { QUIZ, type QuizQ, type QuizTopic } from '@/lib/learn';

const LEVEL_COLOR: Record<QuizQ['level'], string> = { 쉬움: '#16a34a', 보통: '#ea580c', 어려움: '#dc2626' };
const TOPIC_COLOR: Record<QuizTopic, string> = { 기초: '#16a34a', 화면: '#2563eb', 시그니처: '#ea580c' };
const TOPICS: (QuizTopic | 'all')[] = ['all', '기초', '화면', '시그니처'];
const TOPIC_LIST: QuizTopic[] = ['기초', '화면', '시그니처'];

export default function QuizPage() {
  const [picked, setPicked] = useState<Record<number, number>>({});
  const [filter, setFilter] = useState<QuizTopic | 'all'>('all');

  const pick = (i: number, oi: number) => setPicked((p) => (i in p ? p : { ...p, [i]: oi }));
  const retry = (i: number) => setPicked((p) => { const n = { ...p }; delete n[i]; return n; });
  const reset = () => setPicked({});

  const items = QUIZ.map((q, i) => ({ q, i })).filter((x) => filter === 'all' || x.q.topic === filter);
  const answered = Object.keys(picked).length;
  const correct = Object.entries(picked).filter(([i, v]) => QUIZ[+i].ans === v).length;

  // 주제별 집계 (약점 분석)
  const byTopic: Record<string, { ok: number; n: number }> = {};
  Object.entries(picked).forEach(([i, v]) => {
    const q = QUIZ[+i];
    if (!byTopic[q.topic]) byTopic[q.topic] = { ok: 0, n: 0 };
    byTopic[q.topic].n++;
    if (q.ans === v) byTopic[q.topic].ok++;
  });
  const weakest = Object.entries(byTopic)
    .filter(([, s]) => s.n > 0)
    .sort((a, b) => a[1].ok / a[1].n - b[1].ok / b[1].n)[0];

  const chip = (on: boolean) =>
    `text-xs px-2.5 py-1 rounded-lg font-medium ${on ? 'bg-accent-600 text-white' : 'bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-slate-200 dark:hover:bg-white/10'}`;

  return (
    <Shell title="학습하기">
      <LearnTabs />

      {/* 주제 필터 + 점수 + 다시 풀기 */}
      <div className="flex items-center gap-1.5 flex-wrap mt-4">
        {TOPICS.map((t) => (
          <button key={t} onClick={() => setFilter(t)} className={chip(filter === t)}>{t === 'all' ? '전체' : t}</button>
        ))}
        <div className="ml-auto flex items-center gap-3">
          <span className="text-sm text-slate-500">
            점수 <b className="text-slate-800 dark:text-slate-100">{correct}</b> / {answered} <span className="text-slate-400">(총 {QUIZ.length}문제)</span>
          </span>
          <button onClick={reset}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-slate-200 dark:hover:bg-white/10">
            <RotateCcw size={14} />전체 다시 풀기
          </button>
        </div>
      </div>

      {/* 약점 분석 */}
      {answered > 0 && (
        <div className="mt-4 rounded-xl bg-white dark:bg-[#15161f] border border-slate-200 dark:border-white/10 p-4">
          <div className="text-sm font-medium mb-3">주제별 정답률</div>
          <div className="space-y-2">
            {TOPIC_LIST.map((t) => {
              const s = byTopic[t];
              const ratio = s ? s.ok / s.n : 0;
              const c = TOPIC_COLOR[t];
              return (
                <div key={t} className="flex items-center gap-2 text-xs">
                  <span className="w-14 shrink-0 font-medium" style={{ color: c }}>{t}</span>
                  <div className="flex-1 h-2.5 rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${ratio * 100}%`, background: c }} />
                  </div>
                  <span className="w-12 shrink-0 text-right tabular-nums text-slate-500">{s ? `${s.ok}/${s.n}` : '–'}</span>
                </div>
              );
            })}
          </div>
          {weakest && weakest[1].ok / weakest[1].n < 1 && (
            <div className="mt-3 text-xs text-amber-600 dark:text-amber-500">
              가장 약한 주제: <b>{weakest[0]}</b> — 위 ‘시그니처 설명’ 탭에서 관련 항목을 다시 보세요.
            </div>
          )}
        </div>
      )}

      {/* 문제 */}
      <div className="mt-4 space-y-4">
        {items.map(({ q, i }) => {
          const sel = picked[i];
          const done = sel != null;
          const wrong = done && sel !== q.ans;
          const lc = LEVEL_COLOR[q.level];
          const tc = TOPIC_COLOR[q.topic];
          return (
            <div key={i} className="rounded-xl bg-white dark:bg-[#15161f] border border-slate-200 dark:border-white/10 p-5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] px-2 py-0.5 rounded font-medium" style={{ background: `${tc}1a`, color: tc }}>{q.topic}</span>
                <span className="text-[11px] px-2 py-0.5 rounded font-medium" style={{ background: `${lc}1a`, color: lc }}>{q.level}</span>
                {q.scenario && <span className="text-[11px] px-2 py-0.5 rounded font-medium bg-slate-100 dark:bg-white/5 text-slate-500">시나리오</span>}
                <span className="text-xs text-slate-400 ml-auto">문제 {i + 1}</span>
              </div>
              <div className="font-medium mt-2">{q.q}</div>

              <div className="mt-3 space-y-2">
                {q.opts.map((o, oi) => {
                  const isAns = oi === q.ans;
                  const isPick = oi === sel;
                  let cls = 'border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5';
                  if (done) {
                    if (isAns) cls = 'border-green-500/60 bg-green-500/10 text-green-700 dark:text-green-400';
                    else if (isPick) cls = 'border-red-500/60 bg-red-500/10 text-red-700 dark:text-red-400';
                    else cls = 'border-slate-200 dark:border-white/10 opacity-60';
                  }
                  return (
                    <button key={oi} onClick={() => pick(i, oi)} disabled={done}
                      className={`block w-full text-left text-sm px-3.5 py-2.5 rounded-lg border ${cls} ${done ? 'cursor-default' : ''}`}>
                      {o}
                    </button>
                  );
                })}
              </div>

              {done && (
                <div className="mt-3 text-sm">
                  <span className="font-medium" style={{ color: sel === q.ans ? '#16a34a' : '#dc2626' }}>
                    {sel === q.ans ? '정답!' : '아쉬워요'}
                  </span>{' '}
                  <span className="text-slate-600 dark:text-slate-300">{q.exp}</span>
                  <div className="mt-2 flex items-center gap-4 flex-wrap">
                    {wrong && q.relatedId && (
                      <Link href={`/learn?item=${q.relatedId}`}
                        className="inline-flex items-center gap-1 text-xs text-accent-600 dark:text-accent-500 hover:underline">
                        관련 설명 보기<ArrowRight size={12} />
                      </Link>
                    )}
                    <button onClick={() => retry(i)}
                      className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                      <RotateCcw size={12} />다시 풀기
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Shell>
  );
}
