'use client';

import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { Shell } from '@/components/Shell';
import { LearnTabs } from '@/components/LearnTabs';
import { QUIZ, type QuizQ } from '@/lib/learn';

const LEVEL_COLOR: Record<QuizQ['level'], string> = { 쉬움: '#16a34a', 보통: '#ea580c', 어려움: '#dc2626' };
const LEVELS: (QuizQ['level'] | 'all')[] = ['all', '쉬움', '보통', '어려움'];

export default function QuizPage() {
  const [picked, setPicked] = useState<Record<number, number>>({});
  const [filter, setFilter] = useState<QuizQ['level'] | 'all'>('all');

  const pick = (i: number, oi: number) =>
    setPicked((p) => (i in p ? p : { ...p, [i]: oi })); // 한 번 고르면 고정(채점 잠금)
  const reset = () => setPicked({});

  const items = QUIZ.map((q, i) => ({ q, i })).filter((x) => filter === 'all' || x.q.level === filter);
  const answered = Object.keys(picked).length;
  const correct = Object.entries(picked).filter(([i, v]) => QUIZ[+i].ans === v).length;

  const chip = (on: boolean) =>
    `text-xs px-2.5 py-1 rounded-lg font-medium ${on ? 'bg-accent-600 text-white' : 'bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-slate-200 dark:hover:bg-white/10'}`;

  return (
    <Shell title="학습하기">
      <LearnTabs />

      {/* 난이도 필터 + 점수 + 다시 풀기 */}
      <div className="flex items-center gap-1.5 flex-wrap mt-4">
        {LEVELS.map((l) => (
          <button key={l} onClick={() => setFilter(l)} className={chip(filter === l)}>
            {l === 'all' ? '전체' : l}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-3">
          <span className="text-sm text-slate-500">
            점수 <b className="text-slate-800 dark:text-slate-100">{correct}</b> / {answered} <span className="text-slate-400">(총 {QUIZ.length}문제)</span>
          </span>
          <button onClick={reset}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-slate-200 dark:hover:bg-white/10">
            <RotateCcw size={14} />다시 풀기
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        {items.map(({ q, i }) => {
          const sel = picked[i];
          const done = sel != null;
          const lc = LEVEL_COLOR[q.level];
          return (
            <div key={i} className="rounded-xl bg-white dark:bg-[#15161f] border border-slate-200 dark:border-white/10 p-5">
              <div className="flex items-center gap-2">
                <span className="text-[11px] px-2 py-0.5 rounded font-medium" style={{ background: `${lc}1a`, color: lc }}>{q.level}</span>
                <span className="text-xs text-slate-400">문제 {i + 1}</span>
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
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Shell>
  );
}
