package com.jsycure.dashboard;

import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/** 회원 관리 (ADMIN 전용 — SecurityConfig에서 /api/admin/** 강제). */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final UserService users;

    public AdminController(UserService users) {
        this.users = users;
    }

    @GetMapping("/users")
    public List<UserRow> list() {
        return users.all().stream()
                .map(u -> new UserRow(u.id(), u.username(), u.role(), u.enabled(), u.createdAt()))
                .toList();
    }

    @PatchMapping("/users/{id}/role")
    public Map<String, Object> changeRole(@PathVariable long id, @RequestBody Map<String, String> body) {
        users.changeRole(id, body.get("role"));
        return Map.of("ok", true);
    }

    @DeleteMapping("/users/{id}")
    public Map<String, Object> remove(@PathVariable long id) {
        users.delete(id);
        return Map.of("ok", true);
    }
}
