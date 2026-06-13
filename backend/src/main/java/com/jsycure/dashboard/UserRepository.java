package com.jsycure.dashboard;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/** dashboard_app.app_user 접근 (JdbcTemplate, 읽기/쓰기). */
@Repository
public class UserRepository {

    private final JdbcTemplate jdbc;

    public UserRepository(@Qualifier("authJdbcTemplate") JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private static final RowMapper<AppUser> MAP = (rs, i) -> {
        // created_at(timestamptz) → 절대시각을 ISO-8601(UTC, …Z)로. 프론트가 KST로 정확히 표시.
        var createdAt = rs.getTimestamp("created_at");
        return new AppUser(
                rs.getLong("id"),
                rs.getString("username"),
                rs.getString("password"),
                rs.getString("role"),
                rs.getBoolean("enabled"),
                createdAt == null ? null : createdAt.toInstant().toString());
    };

    public Optional<AppUser> findByUsername(String username) {
        return jdbc.query("SELECT * FROM app_user WHERE username = ?", MAP, username).stream().findFirst();
    }

    public boolean existsByUsername(String username) {
        Integer n = jdbc.queryForObject("SELECT count(*) FROM app_user WHERE username = ?", Integer.class, username);
        return n != null && n > 0;
    }

    public long insert(String username, String passwordHash, String role) {
        Long id = jdbc.queryForObject(
                "INSERT INTO app_user(username, password, role) VALUES (?, ?, ?) RETURNING id",
                Long.class, username, passwordHash, role);
        return id == null ? -1 : id;
    }

    public List<AppUser> findAll() {
        return jdbc.query("SELECT * FROM app_user ORDER BY id", MAP);
    }

    public int updateRole(long id, String role) {
        return jdbc.update("UPDATE app_user SET role = ? WHERE id = ?", role, id);
    }

    public int updatePassword(long id, String passwordHash) {
        return jdbc.update("UPDATE app_user SET password = ? WHERE id = ?", passwordHash, id);
    }

    public int delete(long id) {
        return jdbc.update("DELETE FROM app_user WHERE id = ?", id);
    }
}
