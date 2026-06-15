'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { RotateCcw, ArrowRight, Lock, Trophy, ChevronRight } from 'lucide-react';
import { Shell } from '@/components/Shell';
import { LearnTabs } from '@/components/LearnTabs';
import { QUIZ, STAGES, STAGE_DESC, type QuizQ, type Stage } from '@/lib/learn';
import { loadCleared, markCleared, isUnlocked, PASS_RATIO } from '@/lib/learn-progress';

const LEVEL_COLOR: Record<QuizQ['level'], string> = { 쉬움: '#16a34a', 보통: '#ea580c', 어려움: '#dc2626' };
const STAGE_COLOR: Record<Stage, string> = { 입문: '#16a34a', 기초: '#2563eb', 심화: '#ea580c' };
const PASS_PCT = Math.round(PASS_RATIO * 100);

export default function QuizPage() {
  const [picked, setPicked] = useState<Record<number, number>>({});
  const [stage, setStage] = useState<Stage>('입문');
  const [cleared, setCleared] = useState<Stage[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const c = loadCleared();
    setCleared(c);
    setReady(true);
    const firstOpen = STAGES.find((s) => isUnlocked(s, c) && !c.includes(s))
      ?? [...STAGES].reverse().find((s) => isUnlocked(s, c))
      ?? '입문';
    setStage(firstOpen);
  }, []);

  const its = QUIZ.map((q, i) => ({ q, i })).filter((x) => x.q.stage === stage);
  const answered = its.filter((x) => x.i in picked).length;
  const correct = its.filter((x) => picked[x.i] === x.q.ans).length;
  const allDone = its.length > 0 && answered === its.length;
  const ratio = its.length ? correct / its.length : 0;
  const passed = allDone && ratio >= PASS_RATIO;

  // 단계 완료 + 통과 시 클리어 저장 → 다음 단계 해금
  useEffect(() => {
    if (!ready || !passed || cleared.includes(stage)) return;
    setCleared(markCleared(stage));
  }, [ready, passed, stage, cleared]);

  const pick = (i: number, oi: number) => setPicked((p) => (i in p ? p : { ...p, [i]: oi }));
  const retry = (i: number) => setPicked((p) => { const n = { ...p }; delete n[i]; return n; });
  const retryStage = () => setPicked((p) => {
    const n = { ...p };
    its.forEach((x) => delete n[x.i]);
    return n;
  });

  const nextStage = STAGES[STAGES.indexOf(stage) + 1];

  return (
    <Shell title="학습하기">
      <LearnTabs />

      {/* 단계 탭 */}
      <div className="flex items-center gap-2 flex-wrap mt-4">
        {STAGES.map((s) => {
          const unlocked = isUnlocked(s, cleared);
          const clr = cleared.includes(s);
          const on = s === stage;
          const c = STAGE_COLOR[s];
          return (
            <button key={s} disabled={!unlocked} onClick={() => unlocked && setStage(s)}
              className={`flex items-center gap-1.5 text-sm px-3.5 py-2 rounded-lg font-medium border transition ${
                on ? 'text-white' : unlocked ? 'bg-white dark:bg-[#15161f] border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'
                : 'bg-slate-50 dark:bg-white/[.02] border-dashed border-slate-300 dark:border-white/10 text-slate-400 cursor-not-allowed'
              }`}
              style={on ? { background: c, borderColor: c } : undefined}>
              {!unlocked && <Lock size={13} />}
              {s}
              {clr && <Trophy size={13} className={on ? 'text-amber-200' : 'text-amber-500'} />}
            </button>
          );
        })}
      </div>

      {!isUnlocked(stage, cleared) ? (
        <div className="mt-4 rounded-xl bg-white dark:bg-[#15161f] border border-dashed border-slate-300 dark:border-white/10 p-10 grid place-items-center text-center">
          <Lock size={36} className="text-slate-300 dark:text-white/20 mb-3" />
          <div className="text-sm text-slate-500">이전 단계를 {PASS_PCT}% 이상 통과하면 열립니다.</div>
        </div>
      ) : (
        <>
          {/* 단계 헤더 + 진행/점수 */}
          <div className="mt-4 rounded-xl bg-white dark:bg-[#15161f] border border-slate-200 dark:border-white/10 p-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <div className="font-semibold" style={{ color: STAGE_COLOR[stage] }}>{stage} 단계 퀴즈</div>
                <div className="text-xs text-slate-500 mt-0.5">{STAGE_DESC[stage]}</div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-500">
                  점수 <b className="text-slate-800 dark:text-slate-100">{correct}</b> / {answered}
                  <span className="text-slate-400"> (총 {its.length}문제 · {PASS_PCT}% 통과)</span>
                </span>
                <button onClick={retryStage}
                  className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-slate-200 dark:hover:bg-white/10">
                  <RotateCcw size={14} />이 단계 다시 풀기
                </button>
              </div>
            </div>
            <div className="mt-3 h-2 rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${(answered / its.length) * 100}%`, background: STAGE_COLOR[stage] }} />
            </div>
          </div>

          {/* 결과 배너 */}
          {allDone && (
            <div className={`mt-4 rounded-xl border p-4 ${passed ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
              {passed ? (
                <div className="flex items-center gap-3 flex-wrap">
                  <Trophy size={20} className="text-amber-500 shrink-0" />
                  <div className="text-sm">
                    <b className="text-green-700 dark:text-green-400">통과! ({Math.round(ratio * 100)}%)</b>{' '}
                    <span className="text-slate-600 dark:text-slate-300">
                      {nextStage ? `‘${nextStage}’ 단계가 열렸습니다.` : '모든 단계를 마쳤습니다. 수고했어요!'}
                    </span>
                  </div>
                  {nextStage && (
                    <button onClick={() => setStage(nextStage)}
                      className="ml-auto inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-accent-600 text-white font-medium hover:bg-accent-700">
                      {nextStage} 단계로 <ChevronRight size={14} />
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="text-sm">
                    <b className="text-red-600 dark:text-red-400">{Math.round(ratio * 100)}% — 아쉬워요</b>{' '}
                    <span className="text-slate-600 dark:text-slate-300">{PASS_PCT}% 이상이어야 다음 단계가 열립니다. 틀린 문제를 복습하고 다시 도전하세요.</span>
                  </div>
                  <button onClick={retryStage}
                    className="ml-auto inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-accent-600 text-white font-medium hover:bg-accent-700">
                    <RotateCcw size={14} />다시 풀기
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 문제 */}
          <div className="mt-4 space-y-4">
            {its.map(({ q, i }, idx) => {
              const sel = picked[i];
              const done = sel != null;
              const wrong = done && sel !== q.ans;
              const lc = LEVEL_COLOR[q.level];
              return (
                <div key={i} className="rounded-xl bg-white dark:bg-[#15161f] border border-slate-200 dark:border-white/10 p-5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] px-2 py-0.5 rounded font-medium" style={{ background: `${lc}1a`, color: lc }}>{q.level}</span>
                    {q.scenario && <span className="text-[11px] px-2 py-0.5 rounded font-medium bg-slate-100 dark:bg-white/5 text-slate-500">시나리오</span>}
                    <span className="text-xs text-slate-400 ml-auto">문제 {idx + 1} / {its.length}</span>
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
        </>
      )}
    </Shell>
  );
}
