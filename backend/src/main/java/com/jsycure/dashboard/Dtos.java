package com.jsycure.dashboard;

import java.time.OffsetDateTime;
import java.util.List;

/*
 * 응답 DTO 모음 (Java record).
 * DB 컬럼은 절대 변경하지 않으며, 화면에 필요한 형태로만 가공해 내보냅니다.
 */

/** events 테이블 1행 — 실제 컬럼 그대로 */
record EventDto(
        Long id,
        String timestamp,   // DB가 text(ISO 문자열)로 저장 — 그대로 전달, 프론트에서 Date 파싱
        String eventType,
        String srcIp,
        Integer srcPort,
        String destIp,
        Integer destPort,
        String proto,
        String signature     // payload_json에서 추출한 시그니처. 목록엔 payload를 숨기고 signature만 노출.
) {}

/** payload 상세 (모달/다운로드용) — id로 단건 조회 */
record EventPayloadDto(Long id, String payloadJson) {}

/** 페이지네이션 응답 */
record PageResponse<T>(List<T> items, long total, int page, int size) {}

/** key-count 집계 (event_type별, severity별, 프로토콜별, 시그니처별 공용) */
record CountItem(String key, long count) {}

/** 시계열 한 점 (시간 버킷 · event_type · 건수) */
record TimePoint(OffsetDateTime bucket, String eventType, long count) {}

/** Top Talkers (출발지·목적지 IP 순위) */
record TalkerDto(String srcIp, String destIp, long count) {}

/** Alert 모니터링용 경보 1건 (payload_json에서 signature/severity/category 추출) */
record AlertDto(
        Long id,
        String timestamp,   // DB가 text(ISO 문자열)로 저장 — 그대로 전달, 프론트에서 Date 파싱
        String srcIp,
        Integer srcPort,
        String destIp,
        Integer destPort,
        String proto,
        String signature,
        Integer severity,
        String category
) {}

/** 개요(KPI) */
record OverviewDto(
        long totalEvents,
        long alertCount,
        long distinctSrcIp,
        List<CountItem> byEventType,
        List<CountItem> bySeverity
) {}
