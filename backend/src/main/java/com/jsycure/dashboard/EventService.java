package com.jsycure.dashboard;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.List;

/**
 * 매퍼 호출 + 테이블명 검증 + 개요(KPI) 조합.
 * 컬럼/스키마는 변경하지 않으며, 가공은 SQL(payload_json 추출)과 여기서만 수행.
 */
@Service
public class EventService {

    private final EventMapper mapper;
    private final String table;

    public EventService(EventMapper mapper, @Value("${app.events-table:events}") String table) {
        if (!table.matches("[A-Za-z_][A-Za-z0-9_]*")) {
            throw new IllegalArgumentException("Invalid table name: " + table);
        }
        this.mapper = mapper;
        this.table = table;
    }

    /** ⑥ 검색·필터 + 페이지네이션 */
    public PageResponse<EventDto> events(OffsetDateTime from, OffsetDateTime to,
                                         String eventType, String ip, String q,
                                         int page, int size) {
        int s = Math.min(Math.max(size, 1), 500);
        int p = Math.max(page, 0);
        List<EventDto> items = mapper.findEvents(table, from, to, eventType, ip, q, s, p * s);
        long total = mapper.countEvents(table, from, to, eventType, ip, q);
        return new PageResponse<>(items, total, p, s);
    }

    /** payload 단건 (상세/다운로드) */
    public EventPayloadDto eventPayload(long id) {
        return mapper.findPayloadById(table, id);
    }

    /** 로그탐색 요약 ① 시각별 로그 개수 (interval 화이트리스트) */
    public List<CountItem> eventsHistogram(OffsetDateTime from, OffsetDateTime to,
                                           String eventType, String ip, String q, String interval) {
        String iv = switch (interval == null ? "hour" : interval) {
            case "minute" -> "minute";
            case "day" -> "day";
            default -> "hour";
        };
        return mapper.eventsHistogram(table, iv, from, to, eventType, ip, q);
    }

    /** 로그탐색 요약 ② Top 공격 출발지 IP */
    public List<CountItem> eventsTopSrc(OffsetDateTime from, OffsetDateTime to,
                                        String eventType, String ip, String q, int limit) {
        return mapper.eventsTopSrc(table, from, to, eventType, ip, q, Math.min(Math.max(limit, 1), 100));
    }

    /** 개요(KPI) */
    public OverviewDto overview() {
        return new OverviewDto(
                mapper.total(table),
                mapper.alertCount(table),
                mapper.distinctSrcIp(table),
                mapper.byEventType(table),
                mapper.bySeverity(table));
    }

    /** ④ 시계열 이벤트 추이 (interval 화이트리스트) */
    public List<TimePoint> timeseries(OffsetDateTime from, OffsetDateTime to, String interval, String eventType) {
        String iv = switch (interval == null ? "hour" : interval) {
            case "minute" -> "minute";
            case "day" -> "day";
            default -> "hour";
        };
        return mapper.timeseries(table, iv, from, to, eventType);
    }

    /** ② 트래픽·프로토콜 통계 */
    public List<CountItem> protocols() {
        return mapper.protocols(table);
    }

    /** ③ Top Talkers (by=src|dest|pair) */
    public List<TalkerDto> topTalkers(String by, int limit) {
        int l = Math.min(Math.max(limit, 1), 100);
        return switch (by == null ? "pair" : by) {
            case "src" -> mapper.topTalkersSrc(table, l);
            case "dest" -> mapper.topTalkersDest(table, l);
            default -> mapper.topTalkersPair(table, l);
        };
    }

    /** ⑤ 시그니처별 집계 */
    public List<CountItem> signatures(int limit) {
        return mapper.signatures(table, Math.min(Math.max(limit, 1), 100));
    }

    /** ① Alert 모니터링 (최근 경보) */
    public List<AlertDto> recentAlerts(int limit) {
        return mapper.recentAlerts(table, Math.min(Math.max(limit, 1), 200));
    }
}
