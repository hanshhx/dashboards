package com.jsycure.dashboard;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

/**
 * 대시보드 6대 기능 + 개요 API. (데이터 접근은 MyBatis → EventService)
 *  ① /api/alerts/recent      Alert 모니터링
 *  ② /api/stats/protocols    트래픽·프로토콜 통계
 *  ③ /api/stats/top-talkers  Top Talkers
 *  ④ /api/stats/timeseries   시계열 이벤트 추이
 *  ⑤ /api/stats/signatures   시그니처별 집계
 *  ⑥ /api/events             검색·필터(기간·IP·event_type)
 *     /api/stats/overview     KPI
 */
@RestController
@RequestMapping("/api")
public class DashboardController {

    private final EventService service;

    public DashboardController(EventService service) {
        this.service = service;
    }

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "ok");
    }

    /** ⑥ 검색·필터 + 로그 테이블 (페이지네이션) */
    @GetMapping("/events")
    public PageResponse<EventDto> events(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime to,
            @RequestParam(required = false) String eventType,
            @RequestParam(required = false) String ip,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return service.events(from, to, eventType, ip, q, page, size);
    }

    /** payload 상세 (모달/다운로드) — 목록엔 payload를 안 내보내고 여기서 단건 조회 */
    @GetMapping("/events/{id}/payload")
    public EventPayloadDto eventPayload(@PathVariable long id) {
        return service.eventPayload(id);
    }

    /** 로그탐색 요약 ① 시각별 로그 개수 (현재 필터 반영) */
    @GetMapping("/events/histogram")
    public List<CountItem> eventsHistogram(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime to,
            @RequestParam(required = false) String eventType,
            @RequestParam(required = false) String ip,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "hour") String interval) {
        return service.eventsHistogram(from, to, eventType, ip, q, interval);
    }

    /** 로그탐색 요약 ② Top 공격 출발지 IP (현재 필터 반영) */
    @GetMapping("/events/top-src")
    public List<CountItem> eventsTopSrc(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime to,
            @RequestParam(required = false) String eventType,
            @RequestParam(required = false) String ip,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "10") int limit) {
        return service.eventsTopSrc(from, to, eventType, ip, q, limit);
    }

    /** 개요(KPI) */
    @GetMapping("/stats/overview")
    public OverviewDto overview() {
        return service.overview();
    }

    /** ④ 시계열 이벤트 추이 (interval = minute|hour|day) */
    @GetMapping("/stats/timeseries")
    public List<TimePoint> timeseries(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime to,
            @RequestParam(defaultValue = "hour") String interval,
            @RequestParam(required = false) String eventType) {
        return service.timeseries(from, to, interval, eventType);
    }

    /** ② 트래픽·프로토콜 통계 */
    @GetMapping("/stats/protocols")
    public List<CountItem> protocols() {
        return service.protocols();
    }

    /** ③ Top Talkers (by = src|dest|pair) */
    @GetMapping("/stats/top-talkers")
    public List<TalkerDto> topTalkers(
            @RequestParam(defaultValue = "pair") String by,
            @RequestParam(defaultValue = "10") int limit) {
        return service.topTalkers(by, limit);
    }

    /** ⑤ 시그니처별 집계 */
    @GetMapping("/stats/signatures")
    public List<CountItem> signatures(@RequestParam(defaultValue = "10") int limit) {
        return service.signatures(limit);
    }

    /** ① Alert 모니터링 (최근 경보) */
    @GetMapping("/alerts/recent")
    public List<AlertDto> recentAlerts(@RequestParam(defaultValue = "20") int limit) {
        return service.recentAlerts(limit);
    }
}

/** 에러를 JSON으로 반환 (payload_json 캐스팅 실패, DB 연결 오류 등) */
@RestControllerAdvice
class ApiExceptionHandler {
    @ExceptionHandler(Exception.class)
    ResponseEntity<Map<String, Object>> handle(Exception e) {
        return ResponseEntity.status(500).body(Map.of(
                "error", e.getClass().getSimpleName(),
                "message", String.valueOf(e.getMessage())));
    }
}
