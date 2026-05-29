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

    List<AlertDto> recentAlerts(@Param("t") String t, @Param("limit") int limit);
}
