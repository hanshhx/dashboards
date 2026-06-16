'use client';
// 학습 단계(입문 → 기초 → 심화) 진행·잠금 상태. localStorage 기반, 학습/퀴즈 페이지가 공유한다.
// 게임의 스테이지처럼, 이전 단계의 퀴즈를 80% 이상 통과해야 다음 단계가 열린다(학습글·퀴즈 모두).

import { STAGES, type Stage } from './learn';
import { getToken } from './auth';

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
    pushProgress();
  }
  return cur;
}

export function resetProgress() {
  write(CLEARED_KEY, []);
  write(DONE_KEY, []);
  pushProgress();
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
  pushProgress();
  return next;
}
/** 다 읽었을 때 자동 완료 — 추가만(끄지 않음) */
export function markDoneOnce(id: string): string[] {
  const cur = loadDone();
  if (!cur.includes(id)) { cur.push(id); write(DONE_KEY, cur); pushProgress(); }
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
  pushProgress();
}

// ── 틀린 문제(복습용) — qKey 집합. 틀리면 추가, 맞히면 제거 ──
const WRONG_KEY = 'quiz_wrong_v1';
export const loadWrong = (): string[] => read<string[]>(WRONG_KEY, []);
export function recordResult(key: string, correct: boolean): string[] {
  const cur = loadWrong();
  const has = cur.includes(key);
  if (correct && has) { const next = cur.filter((k) => k !== key); write(WRONG_KEY, next); pushProgress(); return next; }
  if (!correct && !has) { cur.push(key); write(WRONG_KEY, cur); pushProgress(); return cur; }
  return cur;
}

// ── 서버 동기화(로그인 시) — localStorage 전체를 계정에 저장/병합 ──
// 로그인하지 않았거나 백엔드가 아직 없으면 모두 조용히 무시하고 로컬만 사용한다.
type Snapshot = { cleared: Stage[]; done: string[]; notes: Record<string, string>; wrong: string[] };
function uniq<T>(a: T[]): T[] { return Array.from(new Set(a)); }

function snapshot(): Snapshot {
  return { cleared: loadCleared(), done: loadDone(), notes: loadNotes(), wrong: loadWrong() };
}

// 서버 값과 로컬 값을 합쳐(배열은 합집합, 메모는 로컬 우선) localStorage에 반영
function mergeInto(server: Partial<Snapshot>) {
  const cur = snapshot();
  write(CLEARED_KEY, uniq([...cur.cleared, ...(server.cleared ?? [])]).filter((s) => STAGES.includes(s)));
  write(DONE_KEY, uniq([...cur.done, ...(server.done ?? [])]));
  write(WRONG_KEY, uniq([...cur.wrong, ...(server.wrong ?? [])]));
  write(NOTES_KEY, { ...(server.notes ?? {}), ...cur.notes });
}

let pushTimer: ReturnType<typeof setTimeout> | null = null;
/** 변경 시 호출 — 로그인 상태면 전체 스냅샷을 서버에 저장(0.8초 디바운스). */
export function pushProgress() {
  const t = getToken();
  if (!t) return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    fetch('/api/learn/progress', {
      method: 'PUT',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${t}` },
      body: JSON.stringify(snapshot()),
    }).catch(() => { /* 오프라인/미배포 시 무시 */ });
  }, 800);
}

/** 진입 시 호출 — 서버 진도를 받아 로컬과 병합하고, 합친 결과를 다시 올려 기기 간 수렴. */
export async function pullProgress(): Promise<void> {
  const t = getToken();
  if (!t) return;
  try {
    const res = await fetch('/api/learn/progress', { headers: { Authorization: `Bearer ${t}` } });
    if (!res.ok) return;
    const data = (await res.json()) as Partial<Snapshot>;
    mergeInto(data ?? {});
    pushProgress();
  } catch { /* 미배포/오프라인 시 로컬만 사용 */ }
}
