'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, PenLine, Inbox, CheckCircle2 } from 'lucide-react';
import { Shell } from '@/components/Shell';
import { LearnTabs } from '@/components/LearnTabs';
import { QUIZ, type QuizQ, type Stage } from '@/lib/learn';
import { loadWrong, recordResult, loadNotes, saveNote, qKey, pullProgress } from '@/lib/learn-progress';

const LEVEL_COLOR: Record<QuizQ['level'], string> = { 쉬움: '#16a34a', 보통: '#ea580c', 어려움: '#dc2626' };
const STAGE_COLOR: Record<Stage, string> = { 입문: '#16a34a', 기초: '#2563eb', 심화: '#ea580c' };

// 문제 텍스트 해시(qKey) → 문항 매핑. 오답노트·틀린 문제를 원래 문항과 연결한다.
const BY_KEY = new Map(QUIZ.map((q) => [qKey(q.q), q] as const));

export default function ReviewPage() {
  const [sessionWrong, setSessionWrong] = useState<string[]>([]); // 진입 시점 스냅샷
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [picked, setPicked] = useState<Record<string, number>>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSessionWrong(loadWrong());
    setNotes(loadNotes());
    setReady(true);
    pullProgress().then(() => { setSessionWrong(loadWrong()); setNotes(loadNotes()); });
  }, []);

  const wrongList = sessionWrong
    .map((k) => ({ k, q: BY_KEY.get(k) }))
    .filter((x): x is { k: string; q: QuizQ } => !!x.q);
  const noteList = Object.entries(notes)
    .filter(([, t]) => t && t.trim())
    .map(([k, text]) => ({ k, text, q: BY_KEY.get(k) }));

  const solved = wrongList.filter((x) => picked[x.k] === x.q.ans).length;

  const pick = (k: string, q: QuizQ, oi: number) => {
    if (k in picked) return;
    setPicked((p) => ({ ...p, [k]: oi }));
    recordResult(k, oi === q.ans); // 맞히면 저장소에서 제거 → 다음 방문 때 목록에서 사라짐
  };

  const editNote = (k: string, v: string) => {
    setNotes((n) => ({ ...n, [k]: v }));
    saveNote(k, v);
  };

  const badge = (q: QuizQ) => (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className="text-[11px] px-2 py-0.5 rounded font-medium" style={{ background: `${STAGE_COLOR[q.stage]}1a`, color: STAGE_COLOR[q.stage] }}>{q.stage}</span>
      <span className="text-[11px] px-2 py-0.5 rounded font-medium" style={{ background: `${LEVEL_COLOR[q.level]}1a`, color: LEVEL_COLOR[q.level] }}>{q.level}</span>
      {q.scenario && <span className="text-[11px] px-2 py-0.5 rounded font-medium bg-slate-100 dark:bg-white/5 text-slate-500">시나리오</span>}
    </div>
  );

  const emptyBox = (text: string) => (
    <div className="rounded-xl border border-dashed border-slate-300 dark:border-white/10 p-10 grid place-items-center text-center">
      <Inbox size={32} className="text-slate-300 dark:text-white/20 mb-2" />
      <div className="text-sm text-slate-500">{text}</div>
    </div>
  );

  return (
    <Shell title="학습하기">
      <LearnTabs />

      {/* 틀린 문제 다시 풀기 */}
      <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-base font-semibold">틀린 문제 다시 풀기</h2>
        {ready && wrongList.length > 0 && (
          <span className="text-sm text-slate-500">남은 <b className="text-slate-800 dark:text-slate-100">{wrongList.length - solved}</b>개 · 이번에 해결 {solved}개</span>
        )}
      </div>
      <p className="text-xs text-slate-400 mt-1">퀴즈에서 틀린 문제가 모입니다. 여기서 다시 맞히면 목록에서 빠집니다.</p>

      <div className="mt-3 space-y-4">
        {ready && wrongList.length === 0 && emptyBox('아직 틀린 문제가 없습니다. 퀴즈를 풀면 틀린 문제가 여기 모입니다.')}
        {wrongList.map(({ k, q }) => {
          const sel = picked[k];
          const done = sel != null;
          const correct = done && sel === q.ans;
          return (
            <div key={k} className="rounded-xl bg-white dark:bg-[#15161f] border border-slate-200 dark:border-white/10 p-5">
              <div className="flex items-center justify-between gap-2">
                {badge(q)}
                {correct && <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-500"><CheckCircle2 size={14} />해결됨</span>}
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
                    <button key={oi} onClick={() => pick(k, q, oi)} disabled={done}
                      className={`block w-full text-left text-sm px-3.5 py-2.5 rounded-lg border ${cls} ${done ? 'cursor-default' : ''}`}>
                      {o}
                    </button>
                  );
                })}
              </div>
              {done && (
                <div className="mt-3 text-sm">
                  <span className="font-medium" style={{ color: correct ? '#16a34a' : '#dc2626' }}>{correct ? '정답!' : '아쉬워요'}</span>{' '}
                  <span className="text-slate-600 dark:text-slate-300">{q.detail ?? q.exp}</span>
                  {q.relatedId && (
                    <div className="mt-2">
                      <Link href={`/learn?item=${q.relatedId}`} className="inline-flex items-center gap-1 text-xs text-accent-600 dark:text-accent-500 hover:underline">
                        관련 설명 보기<ArrowRight size={12} />
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 오답노트 모아보기 */}
      <h2 className="text-base font-semibold mt-8 flex items-center gap-2"><PenLine size={16} className="text-accent-600 dark:text-accent-500" />오답노트 모아보기</h2>
      <p className="text-xs text-slate-400 mt-1">퀴즈에서 적어 둔 메모를 한곳에서 보고 수정할 수 있습니다(자동 저장).</p>

      <div className="mt-3 space-y-4">
        {ready && noteList.length === 0 && emptyBox('작성한 오답노트가 없습니다. 퀴즈에서 문제 아래 메모를 적으면 여기 모입니다.')}
        {noteList.map(({ k, text, q }) => (
          <div key={k} className="rounded-xl bg-white dark:bg-[#15161f] border border-slate-200 dark:border-white/10 p-5">
            {q ? badge(q) : <span className="text-[11px] text-slate-400">연결된 문항을 찾지 못함</span>}
            <div className="font-medium mt-2">{q ? q.q : '(문항 없음)'}</div>
            <textarea
              value={notes[k] ?? ''}
              onChange={(e) => editNote(k, e.target.value)}
              rows={2}
              placeholder="메모를 비우면 목록에서 사라집니다"
              className="mt-3 w-full text-sm px-3 py-2 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:border-accent-600 outline-none resize-y text-slate-700 dark:text-slate-200 placeholder:text-slate-400" />
            {q?.relatedId && (
              <div className="mt-2">
                <Link href={`/learn?item=${q.relatedId}`} className="inline-flex items-center gap-1 text-xs text-accent-600 dark:text-accent-500 hover:underline">
                  관련 설명 보기<ArrowRight size={12} />
                </Link>
              </div>
            )}
          </div>
        ))}
      </div>
    </Shell>
  );
}
