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

// ── 서버 동기화(로그인 시) — localStorage 전체를 계정에 저장/동기화 ──
// 로그인 안 했거나 백엔드가 없으면 조용히 무시하고 로컬만 쓴다.
// 정책: 최초 1회만 합집합(기존 로컬 진도 보존), 이후엔 서버가 기준
//       → 완료 해제·초기화·오답 해결이 기기 간에 제대로 전파된다.
type Snapshot = { cleared: Stage[]; done: string[]; notes: Record<string, string>; wrong: string[] };
const SYNCED_KEY = 'learn_synced_v1'; // 이 기기가 계정과 한 번이라도 동기화했는지
function uniq<T>(a: T[]): T[] { return Array.from(new Set(a)); }
const isStage = (s: string): s is Stage => (STAGES as readonly string[]).includes(s);

function snapshot(): Snapshot {
  return { cleared: loadCleared(), done: loadDone(), notes: loadNotes(), wrong: loadWrong() };
}

// 서버에서 받은 임의 JSON을 안전한 Snapshot으로 정제(형태/타입 무검증으로 localStorage가 깨지는 것 방지)
function sanitize(x: unknown): Snapshot {
  const o = x && typeof x === 'object' ? (x as Record<string, unknown>) : {};
  const strArr = (v: unknown): string[] => (Array.isArray(v) ? v.filter((e): e is string => typeof e === 'string') : []);
  const notesRaw = o.notes && typeof o.notes === 'object' ? (o.notes as Record<string, unknown>) : {};
  const notes: Record<string, string> = {};
  for (const k of Object.keys(notesRaw)) if (typeof notesRaw[k] === 'string') notes[k] = notesRaw[k] as string;
  return { cleared: strArr(o.cleared).filter(isStage), done: strArr(o.done), wrong: strArr(o.wrong), notes };
}

function applySnapshot(s: Snapshot) {
  write(CLEARED_KEY, s.cleared);
  write(DONE_KEY, s.done);
  write(WRONG_KEY, s.wrong);
  write(NOTES_KEY, s.notes);
}

// 서버 + 로컬 합집합(배열은 합집합, 같은 메모 키는 로컬 우선). 최초 동기화/경합 시에만 사용.
function unionWithLocal(server: Snapshot): Snapshot {
  const cur = snapshot();
  return {
    cleared: uniq([...cur.cleared, ...server.cleared]).filter(isStage),
    done: uniq([...cur.done, ...server.done]),
    wrong: uniq([...cur.wrong, ...server.wrong]),
    notes: { ...server.notes, ...cur.notes },
  };
}

let pushTimer: ReturnType<typeof setTimeout> | null = null;
let pulling = false;
let mutatedDuringPull = false;
let flushBound = false;

function sendNow(token: string) {
  pushTimer = null;
  try {
    fetch('/api/learn/progress', {
      method: 'PUT',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(snapshot()),
      keepalive: true, // 탭 종료/이동 중에도 마지막 전송이 살아남도록
    }).catch(() => { /* 오프라인/미배포 시 무시 */ });
  } catch { /* ignore */ }
}

// 탭이 숨겨지거나 닫힐 때 대기 중인 변경을 즉시 전송(마지막 0.8초 변경 유실 방지)
function bindFlush() {
  if (flushBound || typeof window === 'undefined') return;
  flushBound = true;
  const flush = () => {
    if (!pushTimer) return;
    clearTimeout(pushTimer);
    const t = getToken();
    if (t) sendNow(t);
  };
  window.addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });
}

/** 변경 시 호출 — 로그인 상태면 전체 스냅샷을 서버에 저장(0.8초 디바운스). */
export function pushProgress() {
  const t = getToken();
  if (!t) return;
  if (pulling) mutatedDuringPull = true; // 당겨오는 중 사용자가 바꿈 → pull이 덮어쓰지 않도록 표시
  bindFlush();
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => sendNow(t), 800);
}

/** 진입 시 호출 — 정책대로 서버 진도를 반영(최초=합집합, 이후=서버 기준). */
export async function pullProgress(): Promise<void> {
  const t = getToken();
  if (!t) return;
  pulling = true;
  mutatedDuringPull = false;
  try {
    const res = await fetch('/api/learn/progress', { headers: { Authorization: `Bearer ${t}` } });
    if (!res.ok) return;
    const server = sanitize(await res.json());
    const firstSync = !read<boolean>(SYNCED_KEY, false);
    write(SYNCED_KEY, true);
    if (firstSync || mutatedDuringPull) {
      applySnapshot(unionWithLocal(server)); // 보존(합집합) 후 서버에 반영
      pushProgress();
    } else {
      applySnapshot(server); // 서버 기준 — 삭제·초기화·해결 전파(별도 push 불필요)
    }
  } catch {
    /* 오프라인/미배포 → 로컬만 사용 */
  } finally {
    pulling = false;
  }
}
