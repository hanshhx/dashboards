package com.jsycure.dashboard;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.OffsetDateTime;
import java.util.List;

/**
 * MyBatis 매퍼 — SQL은 EventMapper.xml 에 정의.
 * 테이블명(t)은 식별자라 ${t} 치환 사용 (서비스에서 화이트리스트 검증 후 전달).
 * 나머지 값은 #{} 바인딩.
 */
@Mapper
public interface EventMapper {

    List<EventDto> findEvents(@Param("t") String t,
                              @Param("from") OffsetDateTime from,
                              @Param("to") OffsetDateTime to,
                              @Param("etype") String etype,
                              @Param("ip") String ip,
                              @Param("q") String q,
                              @Param("limit") int limit,
                              @Param("offset") int offset);

    long countEvents(@Param("t") String t,
                     @Param("from") OffsetDateTime from,
                     @Param("to") OffsetDateTime to,
                     @Param("etype") String etype,
                     @Param("ip") String ip,
                     @Param("q") String q);

    /** payload 단건 (상세 모달 / 다운로드) — id는 text 비교라 String으로 전달, payload_json 텍스트 반환 */
    String findPayloadById(@Param("t") String t, @Param("id") String id);

    /** 로그탐색 요약 ① 시각별 로그 개수 (필터 반영) */
    List<CountItem> eventsHistogram(@Param("t") String t, @Param("iv") String iv,
                                    @Param("from") OffsetDateTime from, @Param("to") OffsetDateTime to,
                                    @Param("etype") String etype, @Param("ip") String ip, @Param("q") String q);

    /** 로그탐색 요약 ② Top 공격 출발지 IP (필터 반영) */
    List<CountItem> eventsTopSrc(@Param("t") String t,
                                 @Param("from") OffsetDateTime from, @Param("to") OffsetDateTime to,
                                 @Param("etype") String etype, @Param("ip") String ip, @Param("q") String q,
                                 @Param("limit") int limit);

    long total(@Param("t") String t);
    long alertCount(@Param("t") String t);
    long distinctSrcIp(@Param("t") String t);

    List<CountItem> byEventType(@Param("t") String t);
    List<CountItem> bySeverity(@Param("t") String t);

    List<TimePoint> timeseries(@Param("t") String t,
                               @Param("iv") String iv,
                               @Param("from") OffsetDateTime from,
                               @Param("to") OffsetDateTime to,
                               @Param("etype") String etype);

    List<CountItem> protocols(@Param("t") String t);

    List<TalkerDto> topTalkersPair(@Param("t") String t, @Param("limit") int limit);
    List<TalkerDto> topTalkersSrc(@Param("t") String t, @Param("limit") int limit);
    List<TalkerDto> topTalkersDest(@Param("t") String t, @Param("limit") int limit);

    List<CountItem> signatures(@Param("t") String t, @Param("limit") int limit);

    List<CountItem> categories(@Param("t") String t, @Param("limit") int limit);
    List<CountItem> topPorts(@Param("t") String t, @Param("limit") int limit);

    List<AlertDto> recentAlerts(@Param("t") String t, @Param("limit") int limit,
                                @Param("sort") String sort, @Param("severity") Integer severity);

    // IP 프로파일
    long ipCount(@Param("t") String t, @Param("ip") String ip);
    long ipAsSrc(@Param("t") String t, @Param("ip") String ip);
    long ipAsDest(@Param("t") String t, @Param("ip") String ip);
    List<CountItem> ipSeverity(@Param("t") String t, @Param("ip") String ip);
    List<CountItem> ipSignatures(@Param("t") String t, @Param("ip") String ip, @Param("limit") int limit);
    List<CountItem> ipPorts(@Param("t") String t, @Param("ip") String ip, @Param("limit") int limit);
    List<CountItem> ipTimeline(@Param("t") String t, @Param("ip") String ip);

    // 시그니처 프로파일
    long sigCount(@Param("t") String t, @Param("sig") String sig);
    List<CountItem> sigSeverity(@Param("t") String t, @Param("sig") String sig);
    List<CountItem> sigTopSrc(@Param("t") String t, @Param("sig") String sig, @Param("limit") int limit);
    List<CountItem> sigPorts(@Param("t") String t, @Param("sig") String sig, @Param("limit") int limit);
    List<CountItem> sigTimeline(@Param("t") String t, @Param("sig") String sig);
}
