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
