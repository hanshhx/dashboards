package com.jsycure.dashboard;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * dashboard_app.learn_progress 접근 (JdbcTemplate, 읽기/쓰기).
 * 사용자 1명당 학습 진도(클리어 단계·완료 항목·오답노트·틀린 문제)를 JSON 한 행으로 보관.
 * 보안 로그 데이터(suricata_db)와 무관 — 회원 DB(dashboard_app)에만 존재.
 */
@Repository
public class LearnProgressRepository {

    private final JdbcTemplate jdbc;

    public LearnProgressRepository(@Qualifier("authJdbcTemplate") JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    /** 해당 사용자의 진도 JSON(문자열). 없으면 비어 있음. */
    public Optional<String> findByUserId(long userId) {
        return jdbc.query("SELECT data::text AS d FROM learn_progress WHERE user_id = ?",
                (rs, i) -> rs.getString("d"), userId).stream().findFirst();
    }

    /** 진도 JSON 저장(있으면 갱신). */
    public void upsert(long userId, String dataJson) {
        jdbc.update(
                "INSERT INTO learn_progress(user_id, data, updated_at) VALUES (?, ?::jsonb, now()) "
                        + "ON CONFLICT (user_id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()",
                userId, dataJson);
    }
}
