package com.jsycure.dashboard;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 감사 로그 — 로그인/등급변경/payload 열람 등 민감 행위 기록 (dashboard_app.audit_log).
 * 모든 작업은 best-effort: 실패해도 본 기능을 막지 않음(감사는 부가 기능).
 */
@Service
public class AuditService {

    private final JdbcTemplate jdbc;

    public AuditService(@Qualifier("authJdbcTemplate") JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    /** 테이블 자동 생성 (없으면) — 별도 SQL 런북 불필요 */
    @PostConstruct
    void init() {
        try {
            jdbc.execute("CREATE TABLE IF NOT EXISTS audit_log (" +
                    "id BIGSERIAL PRIMARY KEY, at TIMESTAMPTZ NOT NULL DEFAULT now(), " +
                    "username VARCHAR(50), action VARCHAR(40), detail VARCHAR(300))");
        } catch (Exception ignored) {
            // app DB가 잠깐 없어도 부팅은 막지 않음
        }
    }

    public void record(String username, String action, String detail) {
        try {
            String d = detail == null ? "" : (detail.length() > 300 ? detail.substring(0, 300) : detail);
            jdbc.update("INSERT INTO audit_log(username, action, detail) VALUES (?, ?, ?)", username, action, d);
        } catch (Exception ignored) {
        }
    }

    private static final RowMapper<AuditEntry> MAP = (rs, i) -> new AuditEntry(
            rs.getLong("id"), rs.getString("at"),
            rs.getString("username"), rs.getString("action"), rs.getString("detail"));

    public List<AuditEntry> recent(int limit) {
        try {
            return jdbc.query(
                    "SELECT id, to_char(at AT TIME ZONE 'UTC', 'YYYY-MM-DD\"T\"HH24:MI:SS\"Z\"') AS at, username, action, detail " +
                    "FROM audit_log ORDER BY id DESC LIMIT ?", MAP, limit);
        } catch (Exception e) {
            return List.of();
        }
    }
}
