'use client';

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import type { Overview, TimePoint, CountItem, Talker, Alert, Page, EventRow, EventPayload } from './types';
import { getToken } from './auth';

// 브라우저는 같은 출처의 /api 만 호출 → Next 서버가 백엔드로 프록시 (X-API-Key 주입).
// 로그인 토큰(JWT)은 Authorization 헤더로 실어 프록시가 백엔드에 그대로 전달.
function authHeaders(): Record<string, string> {
  const h: Record<string, string> = { accept: 'application/json' };
  const t = getToken();
  if (t) h.Authorization = `Bearer ${t}`;
  return h;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`/api${path}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`API ${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

/** 변경 요청(POST/PATCH/DELETE) — 회원관리 등. 에러 메시지를 그대로 throw. */
export async function send<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers = authHeaders();
  if (body !== undefined) headers['content-type'] = 'application/json';
  const res = await fetch(`/api${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let msg = `API ${res.status}`;
    try {
      const e = await res.json();
      if (e?.message) msg = e.message;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  return res.json().catch(() => ({} as T));
}

export const useOverview = () =>
  useQuery({ queryKey: ['overview'], queryFn: () => get<Overview>('/stats/overview') });

export const useTimeseries = (interval = 'hour', eventType?: string) =>
  useQuery({
    queryKey: ['timeseries', interval, eventType],
    queryFn: () =>
      get<TimePoint[]>(`/stats/timeseries?interval=${interval}${eventType ? `&eventType=${eventType}` : ''}`),
  });

export const useProtocols = () =>
  useQuery({ queryKey: ['protocols'], queryFn: () => get<CountItem[]>('/stats/protocols') });

// 관계자(STAFF)+ 전용 — enabled로 권한 없는 사용자는 호출 자체를 막음
export const useTalkers = (by: 'pair' | 'src' | 'dest' = 'pair', limit = 10, enabled = true) =>
  useQuery({
    queryKey: ['talkers', by, limit],
    enabled,
    queryFn: () => get<Talker[]>(`/stats/top-talkers?by=${by}&limit=${limit}`),
  });

export const useSignatures = (limit = 10, enabled = true) =>
  useQuery({
    queryKey: ['signatures', limit],
    enabled,
    queryFn: () => get<CountItem[]>(`/stats/signatures?limit=${limit}`),
  });

export const useRecentAlerts = (limit = 12) =>
  useQuery({ queryKey: ['alerts', limit], queryFn: () => get<Alert[]>(`/alerts/recent?limit=${limit}`) });

export type EventFilter = { eventType?: string; ip?: string; q?: string; page: number; size: number };

export const useEvents = (f: EventFilter) =>
  useQuery({
    queryKey: ['events', f],
    placeholderData: keepPreviousData,
    queryFn: () => {
      const sp = new URLSearchParams();
      if (f.eventType) sp.set('eventType', f.eventType);
      if (f.ip) sp.set('ip', f.ip);
      if (f.q) sp.set('q', f.q);
      sp.set('page', String(f.page));
      sp.set('size', String(f.size));
      return get<Page<EventRow>>(`/events?${sp.toString()}`);
    },
  });

// ── 로그탐색 요약 (현재 필터 반영) ──
export type SummaryFilter = { eventType?: string; ip?: string; q?: string };

function summaryQS(f: SummaryFilter) {
  const sp = new URLSearchParams();
  if (f.eventType) sp.set('eventType', f.eventType);
  if (f.ip) sp.set('ip', f.ip);
  if (f.q) sp.set('q', f.q);
  return sp;
}

export const useEventsHistogram = (f: SummaryFilter, interval = 'hour') =>
  useQuery({
    queryKey: ['events-hist', f, interval],
    queryFn: () => {
      const sp = summaryQS(f);
      sp.set('interval', interval);
      return get<CountItem[]>(`/events/histogram?${sp.toString()}`);
    },
  });

export const useEventsTopSrc = (f: SummaryFilter, limit = 10) =>
  useQuery({
    queryKey: ['events-topsrc', f, limit],
    queryFn: () => {
      const sp = summaryQS(f);
      sp.set('limit', String(limit));
      return get<CountItem[]>(`/events/top-src?${sp.toString()}`);
    },
  });

/** payload 단건 (상세 모달, ADMIN 전용) — id가 있을 때만 조회 */
export const useEventPayload = (id: number | null) =>
  useQuery({
    queryKey: ['payload', id],
    enabled: id != null,
    queryFn: () => get<EventPayload>(`/events/${id}/payload`),
  });

// ── 회원관리 (ADMIN 전용) ──
export type AdminUser = {
  id: number;
  username: string;
  role: 'GENERAL' | 'STAFF' | 'ADMIN';
  enabled: boolean;
  createdAt: string;
};
export const useUsers = (enabled = true) =>
  useQuery({ queryKey: ['admin-users'], enabled, queryFn: () => get<AdminUser[]>('/admin/users') });
