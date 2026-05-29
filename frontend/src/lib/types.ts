// 백엔드(Spring + MyBatis) 응답 타입 — DB 컬럼/스키마와 1:1

export type CountItem = { key: string | null; count: number };

export type Overview = {
  totalEvents: number;
  alertCount: number;
  distinctSrcIp: number;
  byEventType: CountItem[];
  bySeverity: CountItem[];
};

export type TimePoint = { bucket: string; eventType: string; count: number };

export type Talker = { srcIp: string | null; destIp: string | null; count: number };

export type Alert = {
  id: number;
  timestamp: string;
  srcIp: string | null;
  srcPort: number | null;
  destIp: string | null;
  destPort: number | null;
  proto: string | null;
  signature: string | null;
  severity: number | null;
  category: string | null;
};

export type EventRow = {
  id: number;
  timestamp: string;
  eventType: string;
  srcIp: string | null;
  srcPort: number | null;
  destIp: string | null;
  destPort: number | null;
  proto: string | null;
  payloadJson: string;
};

export type Page<T> = { items: T[]; total: number; page: number; size: number };
