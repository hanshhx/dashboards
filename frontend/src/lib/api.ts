'use client';

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import type { Overview, TimePoint, CountItem, Talker, Alert, Page, EventRow, EventPayload } from './types';

// 브라우저는 같은 출처의 /api 만 호출 → Next 서버가 백엔드로 프록시 (next.config.mjs rewrites)
async function get<T>(path: string): Promise<T> {
  const res = await fetch(`/api${path}`, { headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error(`API ${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
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

export const useTalkers = (by: 'pair' | 'src' | 'dest' = 'pair', limit = 10) =>
  useQuery({ queryKey: ['talkers', by, limit], queryFn: () => get<Talker[]>(`/stats/top-talkers?by=${by}&limit=${limit}`) });

export const useSignatures = (limit = 10) =>
  useQuery({ queryKey: ['signatures', limit], queryFn: () => get<CountItem[]>(`/stats/signatures?limit=${limit}`) });

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

/** 시각별 로그 개수 (interval = minute|hour|day) */
export const useEventsHistogram = (f: SummaryFilter, interval = 'hour') =>
  useQuery({
    queryKey: ['events-hist', f, interval],
    queryFn: () => {
      const sp = summaryQS(f);
      sp.set('interval', interval);
      return get<CountItem[]>(`/events/histogram?${sp.toString()}`);
    },
  });

/** Top 공격 출발지 IP */
export const useEventsTopSrc = (f: SummaryFilter, limit = 10) =>
  useQuery({
    queryKey: ['events-topsrc', f, limit],
    queryFn: () => {
      const sp = summaryQS(f);
      sp.set('limit', String(limit));
      return get<CountItem[]>(`/events/top-src?${sp.toString()}`);
    },
  });

/** payload 단건 (상세 모달) — id가 있을 때만 조회 */
export const useEventPayload = (id: number | null) =>
  useQuery({
    queryKey: ['payload', id],
    enabled: id != null,
    queryFn: () => get<EventPayload>(`/events/${id}/payload`),
  });
