'use client';
// 학습 단계(입문 → 기초 → 심화) 진행·잠금 상태. localStorage 기반, 학습/퀴즈 페이지가 공유한다.
// 게임의 스테이지처럼, 이전 단계의 퀴즈를 80% 이상 통과해야 다음 단계가 열린다(학습글·퀴즈 모두).

import { STAGES, type Stage } from './learn';

export const PASS_RATIO = 0.8;           // 통과 기준(80%)
const CLEARED_KEY = 'learn_cleared_v1';  // Stage[] — 클리어한 단계
const DONE_KEY = 'learn_done';           // string[] — 개별 학습 항목 완료(기존 호환)

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, val: unknown) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* ignore */ }
}

export const loadCleared = (): Stage[] => read<Stage[]>(CLEARED_KEY, []);

export function markCleared(stage: Stage): Stage[] {
  const cur = loadCleared();
  if (!cur.includes(stage)) {
    cur.push(stage);
    write(CLEARED_KEY, cur);
  }
  return cur;
}

export function resetProgress() {
  write(CLEARED_KEY, []);
  write(DONE_KEY, []);
}

/** stage 가 열려 있는지 — 입문은 항상, 그 외는 직전 단계가 클리어돼야 함 */
export function isUnlocked(stage: Stage, cleared: Stage[]): boolean {
  const i = STAGES.indexOf(stage);
  if (i <= 0) return true;
  return cleared.includes(STAGES[i - 1]);
}

/** 개별 학습 항목 완료 상태(기존 learn_done 호환) */
export const loadDone = (): string[] => read<string[]>(DONE_KEY, []);
export function toggleDone(id: string): string[] {
  const cur = loadDone();
  const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
  write(DONE_KEY, next);
  return next;
}
/** 다 읽었을 때 자동 완료 — 추가만(끄지 않음) */
export function markDoneOnce(id: string): string[] {
  const cur = loadDone();
  if (!cur.includes(id)) { cur.push(id); write(DONE_KEY, cur); }
  return cur;
}

// ── 오답노트(문제별 메모) — 문제 텍스트 기준 안정 키로 저장 ──
const NOTES_KEY = 'quiz_notes_v1';
export function qKey(q: string): string {
  let h = 0;
  for (let i = 0; i < q.length; i++) h = (h * 31 + q.charCodeAt(i)) | 0;
  return 'q' + (h >>> 0).toString(36);
}
export const loadNotes = (): Record<string, string> => read<Record<string, string>>(NOTES_KEY, {});
export function saveNote(key: string, text: string) {
  const n = loadNotes();
  if (text.trim()) n[key] = text; else delete n[key];
  write(NOTES_KEY, n);
}
