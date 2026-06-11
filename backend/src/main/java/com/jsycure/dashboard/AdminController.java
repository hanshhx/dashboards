package com.jsycure.dashboard;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/** 회원 관리 + 감사 로그 (ADMIN 전용 — SecurityConfig에서 /api/admin/** 강제). */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final UserService users;
    private final AuditService audit;

    public AdminController(UserService users, AuditService audit) {
        this.users = users;
        this.audit = audit;
    }

    @GetMapping("/users")
    public List<UserRow> list() {
        return users.all().stream()
                .map(u -> new UserRow(u.id(), u.username(), u.role(), u.enabled(), u.createdAt()))
                .toList();
    }

    @PatchMapping("/users/{id}/role")
    public Map<String, Object> changeRole(Authentication auth, @PathVariable long id, @RequestBody Map<String, String> body) {
        ensureNotSelf(auth, id);
        users.changeRole(id, body.get("role"));
        audit.record(auth.getName(), "ROLE_CHANGE", "user#" + id + " -> " + body.get("role"));
        return Map.of("ok", true);
    }

    @DeleteMapping("/users/{id}")
    public Map<String, Object> remove(Authentication auth, @PathVariable long id) {
        ensureNotSelf(auth, id);
        users.delete(id);
        audit.record(auth.getName(), "USER_DELETE", "user#" + id);
        return Map.of("ok", true);
    }

    /** 본인 계정 강등/삭제 차단 — 마지막 관리자 잠김 방지(프론트뿐 아니라 서버에서도 강제). */
    private void ensureNotSelf(Authentication auth, long id) {
        users.findByUsername(auth.getName())
             .filter(u -> u.id() == id)
             .ifPresent(u -> { throw new IllegalArgumentException("본인 계정에는 이 작업을 할 수 없습니다."); });
    }

    /** 감사 로그 조회 */
    @GetMapping("/audit")
    public List<AuditEntry> auditLog(@RequestParam(defaultValue = "100") int limit) {
        return audit.recent(Math.min(Math.max(limit, 1), 500));
    }
}
