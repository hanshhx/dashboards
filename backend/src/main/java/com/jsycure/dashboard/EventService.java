package com.jsycure.dashboard;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

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
        return new EventPayloadDto(id, mapper.findPayloadById(table, String.valueOf(id)));
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

    /** 공격 분류(category) 집계 */
    public List<CountItem> categories(int limit) {
        return mapper.categories(table, Math.min(Math.max(limit, 1), 100));
    }

    /** 대상 포트 Top */
    public List<CountItem> topPorts(int limit) {
        return mapper.topPorts(table, Math.min(Math.max(limit, 1), 100));
    }

    /** ① Alert 모니터링 (sort=recent|severity, severity 필터 옵션) */
    public List<AlertDto> recentAlerts(int limit, String sort, Integer severity) {
        String s = "severity".equals(sort) ? "severity" : "recent";
        return mapper.recentAlerts(table, Math.min(Math.max(limit, 1), 200), s, severity);
    }

    /** 필터된 로그 일괄 내보내기 (payload 제외, 최대 5만건) */
    public List<EventDto> eventsExport(OffsetDateTime from, OffsetDateTime to,
                                       String eventType, String ip, String q) {
        return mapper.findEvents(table, from, to, eventType, ip, q, 50000, 0);
    }

    /** IP 공격자 프로파일 (드릴다운) */
    public IpProfileDto ipProfile(String ip) {
        return new IpProfileDto(ip,
                mapper.ipCount(table, ip), mapper.ipAsSrc(table, ip), mapper.ipAsDest(table, ip),
                mapper.ipSeverity(table, ip), mapper.ipSignatures(table, ip, 10),
                mapper.ipPorts(table, ip, 10), mapper.ipTimeline(table, ip));
    }

    /** 시그니처(탐지 룰) 프로파일 (드릴다운) */
    public SignatureProfileDto signatureProfile(String sig) {
        return new SignatureProfileDto(sig,
                mapper.sigCount(table, sig), mapper.sigSeverity(table, sig),
                mapper.sigTopSrc(table, sig, 10), mapper.sigPorts(table, sig, 10), mapper.sigTimeline(table, sig));
    }

    // ===== MITRE ATT&CK 매핑 =====
    // 표준 14개 전술 (kill-chain 순서). {id, 영문, 한글}
    private static final String[][] TACTICS = {
            {"TA0043", "Reconnaissance", "정찰"},
            {"TA0042", "Resource Development", "자원 개발"},
            {"TA0001", "Initial Access", "초기 침투"},
            {"TA0002", "Execution", "실행"},
            {"TA0003", "Persistence", "지속"},
            {"TA0004", "Privilege Escalation", "권한 상승"},
            {"TA0005", "Defense Evasion", "방어 회피"},
            {"TA0006", "Credential Access", "자격증명 접근"},
            {"TA0007", "Discovery", "탐색"},
            {"TA0008", "Lateral Movement", "내부 이동"},
            {"TA0009", "Collection", "수집"},
            {"TA0011", "Command and Control", "명령·제어(C2)"},
            {"TA0010", "Exfiltration", "유출"},
            {"TA0040", "Impact", "영향"},
    };

    /** Suricata category(classtype) → ATT&CK 전술 (키워드 휴리스틱). 미매칭은 null. */
    private static String classify(String category) {
        if (category == null) return null;
        String c = category.toLowerCase();
        if (c.contains("scan") || c.contains("recon")) return "Reconnaissance";
        if (c.contains("web application")) return "Initial Access";
        if (c.contains("social engineer") || c.contains("phishing")) return "Initial Access";
        if (c.contains("executable") || c.contains("shellcode")) return "Execution";
        if (c.contains("privilege")) return "Privilege Escalation";
        if (c.contains("credential") || c.contains("brute") || c.contains("login attempt") || c.contains("password")) return "Credential Access";
        if (c.contains("trojan") || c.contains("command and control") || c.contains("cnc") || c.contains("malware") || c.contains("botnet")) return "Command and Control";
        if (c.contains("information leak") || c.contains("exfil")) return "Exfiltration";
        if (c.contains("denial of service") || c.contains("ddos") || c.contains("mining") || c.contains("impact")) return "Impact";
        if (c.contains("evasion") || c.contains("policy violation")) return "Defense Evasion";
        if (c.contains("protocol command decode") || c.contains("enumeration") || c.contains("discovery")) return "Discovery";
        if (c.contains("lateral")) return "Lateral Movement";
        if (c.contains("collection")) return "Collection";
        if (c.contains("persistence")) return "Persistence";
        return null;
    }

    /** 탐지된 공격을 ATT&CK 전술 매트릭스로 집계 */
    public AttackMatrix attackMatrix() {
        List<CountItem> cats = mapper.categories(table, 1000);
        Map<String, Long> counts = new HashMap<>();
        Map<String, List<CountItem>> byTactic = new HashMap<>();
        long mapped = 0, unmapped = 0;
        List<CountItem> unmappedCats = new ArrayList<>();
        for (CountItem ci : cats) {
            String tactic = classify(ci.key());
            if (tactic == null) {
                unmapped += ci.count();
                unmappedCats.add(ci);
                continue;
            }
            mapped += ci.count();
            counts.merge(tactic, ci.count(), Long::sum);
            byTactic.computeIfAbsent(tactic, k -> new ArrayList<>()).add(ci);
        }
        List<AttackTactic> tactics = new ArrayList<>();
        for (String[] t : TACTICS) {
            List<CountItem> tc = new ArrayList<>(byTactic.getOrDefault(t[1], List.of()));
            tc.sort((a, b) -> Long.compare(b.count(), a.count()));
            tactics.add(new AttackTactic(t[0], t[1], t[2], counts.getOrDefault(t[1], 0L), tc));
        }
        return new AttackMatrix(tactics, mapped, unmapped, unmappedCats);
    }
}
