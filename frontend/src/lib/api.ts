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

// 공격 분류 / 대상 포트 (관계자+)
export const useCategories = (limit = 8, enabled = true) =>
  useQuery({ queryKey: ['categories', limit], enabled, queryFn: () => get<CountItem[]>(`/stats/categories?limit=${limit}`) });

export const useTopPorts = (limit = 8, enabled = true) =>
  useQuery({ queryKey: ['topports', limit], enabled, queryFn: () => get<CountItem[]>(`/stats/top-ports?limit=${limit}`) });

// Alert 모니터링 — sort: recent|severity, severity 필터(1=높음·2=중간·3=낮음)
export const useRecentAlerts = (limit = 12, sort: 'recent' | 'severity' = 'recent', severity?: number) =>
  useQuery({
    queryKey: ['alerts', limit, sort, severity ?? null],
    queryFn: () => {
      const sp = new URLSearchParams({ limit: String(limit), sort });
      if (severity != null) sp.set('severity', String(severity));
      return get<Alert[]>(`/alerts/recent?${sp.toString()}`);
    },
  });

export type EventFilter = { eventType?: string; ip?: string; q?: string; from?: string; to?: string; page: number; size: number };

export const useEvents = (f: EventFilter) =>
  useQuery({
    queryKey: ['events', f],
    placeholderData: keepPreviousData,
    queryFn: () => {
      const sp = new URLSearchParams();
      if (f.eventType) sp.set('eventType', f.eventType);
      if (f.ip) sp.set('ip', f.ip);
      if (f.q) sp.set('q', f.q);
      if (f.from) sp.set('from', f.from);
      if (f.to) sp.set('to', f.to);
      sp.set('page', String(f.page));
      sp.set('size', String(f.size));
      return get<Page<EventRow>>(`/events?${sp.toString()}`);
    },
  });

// ── 로그탐색 요약 (현재 필터 반영) ──
export type SummaryFilter = { eventType?: string; ip?: string; q?: string; from?: string; to?: string };

function summaryQS(f: SummaryFilter) {
  const sp = new URLSearchParams();
  if (f.eventType) sp.set('eventType', f.eventType);
  if (f.ip) sp.set('ip', f.ip);
  if (f.q) sp.set('q', f.q);
  if (f.from) sp.set('from', f.from);
  if (f.to) sp.set('to', f.to);
  return sp;
}

/** 필터된 로그 일괄 내보내기 (payload 제외, 최대 5만건) */
export async function fetchEventsExport(f: SummaryFilter): Promise<EventRow[]> {
  return get<EventRow[]>(`/events/export?${summaryQS(f).toString()}`);
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
  role: 'GENERAL' | 'STAFF' | 'ADMIN' | 'GUEST';
  enabled: boolean;
  createdAt: string;
  expiresAt: string | null;
};
export const useUsers = (enabled = true) =>
  useQuery({ queryKey: ['admin-users'], enabled, queryFn: () => get<AdminUser[]>('/admin/users') });

// ── IP / 시그니처 드릴다운 분석 (관계자+) ──
export type IpProfile = {
  ip: string; total: number; asSrc: number; asDest: number;
  bySeverity: CountItem[]; topSignatures: CountItem[]; topPorts: CountItem[]; timeline: CountItem[];
};
export type SignatureProfile = {
  signature: string; total: number;
  bySeverity: CountItem[]; topSrcIps: CountItem[]; topPorts: CountItem[]; timeline: CountItem[];
};

export const useIpProfile = (ip: string | null) =>
  useQuery({
    queryKey: ['ip-profile', ip],
    enabled: !!ip,
    queryFn: () => get<IpProfile>(`/analysis/ip?ip=${encodeURIComponent(ip!)}`),
  });

export const useSignatureProfile = (sig: string | null) =>
  useQuery({
    queryKey: ['sig-profile', sig],
    enabled: !!sig,
    queryFn: () => get<SignatureProfile>(`/analysis/signature?sig=${encodeURIComponent(sig!)}`),
  });

// ── 감사 로그 (관리자) ──
export type AuditEntry = { id: number; at: string; username: string; action: string; detail: string };
export const useAudit = (limit = 100, enabled = true) =>
  useQuery({ queryKey: ['audit', limit], enabled, queryFn: () => get<AuditEntry[]>(`/admin/audit?limit=${limit}`) });
