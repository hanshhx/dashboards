'use client';

import { useState, useEffect, useMemo, type ReactNode } from 'react';
import Link from 'next/link';
import { RotateCcw, ArrowRight, Lock, Trophy, ChevronRight, GraduationCap, Dumbbell, PenLine, Check } from 'lucide-react';
import { Shell } from '@/components/Shell';
import { LearnTabs } from '@/components/LearnTabs';
import { QUIZ, STAGES, STAGE_DESC, type QuizQ, type Stage } from '@/lib/learn';
import { loadCleared, markCleared, isUnlocked, PASS_RATIO, loadNotes, saveNote, qKey, recordResult, pullProgress } from '@/lib/learn-progress';

const LEVEL_COLOR: Record<QuizQ['level'], string> = { 쉬움: '#16a34a', 보통: '#ea580c', 어려움: '#dc2626' };
const STAGE_COLOR: Record<Stage, string> = { 입문: '#16a34a', 기초: '#2563eb', 심화: '#ea580c' };
const PASS_PCT = Math.round(PASS_RATIO * 100);
const EXAM_N = 20; // 시험 출제 문항 수 (단계 문제은행이 더 적으면 전체)

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function QuizPage() {
  const [stage, setStage] = useState<Stage>('입문');
  const [cleared, setCleared] = useState<Stage[]>([]);
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<'practice' | 'exam'>('practice');
  const [practicePicked, setPracticePicked] = useState<Record<number, number>>({});
  const [examIds, setExamIds] = useState<number[]>([]);
  const [examPicked, setExamPicked] = useState<Record<number, number>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    const c = loadCleared();
    setCleared(c);
    setNotes(loadNotes());
    setReady(true);
    const firstOpen = STAGES.find((s) => isUnlocked(s, c) && !c.includes(s))
      ?? [...STAGES].reverse().find((s) => isUnlocked(s, c)) ?? '입문';
    setStage(firstOpen);
    pullProgress().then(() => { setCleared(loadCleared()); setNotes(loadNotes()); });
  }, []);

  // 단계의 전체 문제 (연습용)
  const stageItems = useMemo(() => QUIZ.map((q, i) => ({ q, i })).filter((x) => x.q.stage === stage), [stage]);

  const startExam = () => {
    const ids = shuffle(stageItems.map((x) => x.i)).slice(0, Math.min(EXAM_N, stageItems.length));
    setExamIds(ids);
    setExamPicked({});
  };

  // 단계 바꾸면 모드·상태 초기화
  const switchStage = (s: Stage) => {
    setStage(s); setMode('practice'); setExamIds([]); setExamPicked({}); setPracticePicked({});
  };

  // 시험 채점
  const examAnswered = examIds.filter((i) => i in examPicked).length;
  const examCorrect = examIds.filter((i) => examPicked[i] === QUIZ[i].ans).length;
  const examDone = examIds.length > 0 && examAnswered === examIds.length;
  const examRatio = examIds.length ? examCorrect / examIds.length : 0;
  const examPassed = examDone && examRatio >= PASS_RATIO;

  useEffect(() => {
    if (!ready || !examPassed || cleared.includes(stage)) return;
    setCleared(markCleared(stage));
  }, [ready, examPassed, stage, cleared]);

  const nextStage = STAGES[STAGES.indexOf(stage) + 1];

  // 연습 점수
  const prAnswered = stageItems.filter((x) => x.i in practicePicked).length;
  const prCorrect = stageItems.filter((x) => practicePicked[x.i] === x.q.ans).length;

  const renderQuestion = (q: QuizQ, i: number, idx: number, total: number, picked: Record<number, number>, onPick: (oi: number) => void, onRetry: () => void) => {
    const sel = picked[i];
    const done = sel != null;
    const wrong = done && sel !== q.ans;
    const lc = LEVEL_COLOR[q.level];
    return (
      <div key={i} className="rounded-xl bg-white dark:bg-[#15161f] border border-slate-200 dark:border-white/10 p-5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] px-2 py-0.5 rounded font-medium" style={{ background: `${lc}1a`, color: lc }}>{q.level}</span>
          {q.scenario && <span className="text-[11px] px-2 py-0.5 rounded font-medium bg-slate-100 dark:bg-white/5 text-slate-500">시나리오</span>}
          <span className="text-xs text-slate-400 ml-auto">문제 {idx + 1} / {total}</span>
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
              <button key={oi} onClick={() => onPick(oi)} disabled={done}
                className={`block w-full text-left text-sm px-3.5 py-2.5 rounded-lg border ${cls} ${done ? 'cursor-default' : ''}`}>
                {o}
              </button>
            );
          })}
        </div>
        {done && (
          <div className="mt-3">
            <div className="rounded-lg border-l-4 px-3.5 py-2.5 text-sm" style={{ borderColor: sel === q.ans ? '#16a34a' : '#dc2626', background: (sel === q.ans ? '#16a34a' : '#dc2626') + '12' }}>
              <span className="font-semibold" style={{ color: sel === q.ans ? '#16a34a' : '#dc2626' }}>{sel === q.ans ? '정답' : '오답'}</span>{' '}
              <span className="text-slate-700 dark:text-slate-200 leading-6">{q.detail ?? q.exp}</span>
            </div>
            {/* 오답노트 / 메모 (자동 저장) */}
            <div className="mt-2">
              <div className="flex items-center gap-1 text-xs text-slate-500 mb-1"><PenLine size={12} /> 오답노트 / 메모</div>
              <textarea
                value={notes[qKey(q.q)] ?? ''}
                onChange={(e) => { const v = e.target.value; const k = qKey(q.q); setNotes((p) => ({ ...p, [k]: v })); saveNote(k, v); }}
                rows={2}
                placeholder="헷갈린 점·기억할 포인트를 적어 두면 자동 저장됩니다"
                className="w-full text-sm px-3 py-2 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:border-accent-600 outline-none resize-y text-slate-700 dark:text-slate-200 placeholder:text-slate-400" />
            </div>
            <div className="mt-2 flex items-center gap-4 flex-wrap">
              {wrong && q.relatedId && (
                <Link href={`/learn?item=${q.relatedId}`} className="inline-flex items-center gap-1 text-xs text-accent-600 dark:text-accent-500 hover:underline">
                  관련 설명 보기<ArrowRight size={12} />
                </Link>
              )}
              <button onClick={onRetry} className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                <RotateCcw size={12} />다시 풀기
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const modeBtn = (m: 'practice' | 'exam', icon: ReactNode, label: string) => (
    <button onClick={() => setMode(m)} aria-pressed={mode === m}
      className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium ${mode === m ? 'bg-accent-600 text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10'}`}>
      {icon}{label}
    </button>
  );

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
            <button key={s} disabled={!unlocked} onClick={() => unlocked && switchStage(s)}
              className={`flex items-center gap-1.5 text-sm px-3.5 py-2 rounded-lg font-medium border transition ${
                on ? 'text-white' : unlocked ? 'bg-white dark:bg-[#15161f] border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'
                : 'bg-slate-50 dark:bg-white/[.02] border-dashed border-slate-300 dark:border-white/10 text-slate-400 cursor-not-allowed'
              }`} style={on ? { background: c, borderColor: c } : undefined}>
              {!unlocked && <Lock size={13} />}{s}
              {clr && <Trophy size={13} className={on ? 'text-amber-200' : 'text-amber-500'} />}
            </button>
          );
        })}
      </div>

      {!isUnlocked(stage, cleared) ? (
        <div className="mt-4 rounded-xl bg-white dark:bg-[#15161f] border border-dashed border-slate-300 dark:border-white/10 p-10 grid place-items-center text-center">
          <Lock size={36} className="text-slate-300 dark:text-white/20 mb-3" />
          <div className="text-sm text-slate-500">이전 단계 시험을 {PASS_PCT}% 이상 통과하면 열립니다.</div>
        </div>
      ) : (
        <>
          {/* 헤더 + 연습/시험 토글 */}
          <div className="mt-4 rounded-xl bg-white dark:bg-[#15161f] border border-slate-200 dark:border-white/10 p-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <div className="font-semibold" style={{ color: STAGE_COLOR[stage] }}>
                  {stage} 단계 {cleared.includes(stage) && <span className="inline-flex items-center gap-1 text-xs text-amber-500">· 통과함 <Check size={12} /></span>}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">{STAGE_DESC[stage]}</div>
              </div>
              <div className="inline-flex rounded-lg border border-slate-200 dark:border-white/10 overflow-hidden">
                {modeBtn('practice', <Dumbbell size={14} />, `연습 (${stageItems.length})`)}
                {modeBtn('exam', <GraduationCap size={14} />, '시험')}
              </div>
            </div>
          </div>

          {/* 연습 모드 */}
          {mode === 'practice' && (
            <>
              <div className="mt-3 text-sm text-slate-500">
                연습 모드 — 점수 <b className="text-slate-800 dark:text-slate-100">{prCorrect}</b> / {prAnswered} (총 {stageItems.length}문제). 통과 판정은 ‘시험’ 탭에서.
              </div>
              <div className="mt-3 space-y-4">
                {stageItems.map(({ q, i }, idx) =>
                  renderQuestion(q, i, idx, stageItems.length, practicePicked,
                    (oi) => { setPracticePicked((p) => (i in p ? p : { ...p, [i]: oi })); recordResult(qKey(q.q), oi === q.ans); },
                    () => setPracticePicked((p) => { const n = { ...p }; delete n[i]; return n; })))}
              </div>
            </>
          )}

          {/* 시험 모드 */}
          {mode === 'exam' && (
            <>
              {examIds.length === 0 ? (
                <div className="mt-4 rounded-xl bg-white dark:bg-[#15161f] border border-slate-200 dark:border-white/10 p-8 text-center">
                  <GraduationCap size={32} className="mx-auto text-accent-600 dark:text-accent-500 mb-2" />
                  <div className="font-semibold">{stage} 단계 시험</div>
                  <div className="text-sm text-slate-500 mt-1">
                    문제 {Math.min(EXAM_N, stageItems.length)}개가 무작위로 출제됩니다. <b>{PASS_PCT}% 이상</b> 맞히면
                    {nextStage ? ` ‘${nextStage}’ 단계가 열립니다.` : ' 전 과정을 마칩니다.'}
                  </div>
                  <button onClick={startExam} className="mt-4 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-accent-600 text-white text-sm font-medium hover:bg-accent-700">
                    시험 시작 <ChevronRight size={15} />
                  </button>
                </div>
              ) : (
                <>
                  <div className="mt-4 rounded-xl bg-white dark:bg-[#15161f] border border-slate-200 dark:border-white/10 p-4">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <span className="text-sm text-slate-500">
                        진행 <b className="text-slate-800 dark:text-slate-100">{examAnswered}</b> / {examIds.length}
                        {examDone && <> · 점수 <b style={{ color: examPassed ? '#16a34a' : '#dc2626' }}>{Math.round(examRatio * 100)}%</b></>}
                      </span>
                      <button onClick={startExam} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-slate-200 dark:hover:bg-white/10">
                        <RotateCcw size={14} />새 문제로 다시 시험
                      </button>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${(examAnswered / examIds.length) * 100}%`, background: STAGE_COLOR[stage] }} />
                    </div>
                  </div>

                  {examDone && (
                    <div className={`mt-4 rounded-xl border p-4 ${examPassed ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                      <div className="flex items-center gap-3 flex-wrap">
                        {examPassed ? <Trophy size={20} className="text-amber-500 shrink-0" /> : null}
                        <div className="text-sm">
                          {examPassed ? (
                            <><b className="text-green-700 dark:text-green-400">통과! ({Math.round(examRatio * 100)}%)</b>{' '}
                              <span className="text-slate-600 dark:text-slate-300">{nextStage ? `‘${nextStage}’ 단계가 열렸습니다.` : '모든 단계를 통과했습니다.'}</span></>
                          ) : (
                            <><b className="text-red-600 dark:text-red-400">{Math.round(examRatio * 100)}% — {PASS_PCT}% 필요</b>{' '}
                              <span className="text-slate-600 dark:text-slate-300">틀린 문제를 복습한 뒤 다시 응시할 수 있습니다.</span></>
                          )}
                        </div>
                        {examPassed && nextStage && (
                          <button onClick={() => switchStage(nextStage)} className="ml-auto inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-accent-600 text-white font-medium hover:bg-accent-700">
                            {nextStage} 단계로 <ChevronRight size={14} />
                          </button>
                        )}
                        {!examPassed && (
                          <button onClick={startExam} className="ml-auto inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-accent-600 text-white font-medium hover:bg-accent-700">
                            <RotateCcw size={14} />다시 시험
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="mt-4 space-y-4">
                    {examIds.map((i, idx) =>
                      renderQuestion(QUIZ[i], i, idx, examIds.length, examPicked,
                        (oi) => { setExamPicked((p) => (i in p ? p : { ...p, [i]: oi })); recordResult(qKey(QUIZ[i].q), oi === QUIZ[i].ans); },
                        () => setExamPicked((p) => { const n = { ...p }; delete n[i]; return n; })))}
                  </div>
                </>
              )}
            </>
          )}
        </>
      )}
    </Shell>
  );
}
