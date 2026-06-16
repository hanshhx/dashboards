package com.jsycure.dashboard;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 로그인 사용자의 학습 진도·오답노트 동기화.
 * SecurityConfig 의 anyRequest().authenticated() 로 보호됨 → 로그인(일반 이상)이면 누구나 본인 진도만 다룬다.
 * 진도는 클라이언트가 병합한 전체 스냅샷(JSON)을 그대로 보관/반환한다(문제 콘텐츠는 정적이라 DB에 두지 않음).
 */
@RestController
@RequestMapping("/api/learn")
public class LearnController {

    private static final int MAX_PROGRESS_CHARS = 64 * 1024; // 진도 JSON 상한(과대 본문 차단)

    private final UserService users;
    private final LearnProgressRepository repo;
    private final ObjectMapper om;

    public LearnController(UserService users, LearnProgressRepository repo, ObjectMapper om) {
        this.users = users;
        this.repo = repo;
        this.om = om;
    }

    private long userId(Authentication auth) {
        return users.findByUsername(auth.getName())
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."))
                .id();
    }

    /** 내 학습 진도 불러오기. 저장된 것이 없거나 손상됐으면 빈 객체(500 대신 안전 복구). */
    @GetMapping("/progress")
    public Map<String, Object> get(Authentication auth) {
        String json = repo.findByUserId(userId(auth)).orElse("{}");
        try {
            JsonNode node = om.readTree(json);
            if (node.isObject()) {
                @SuppressWarnings("unchecked")
                Map<String, Object> m = om.convertValue(node, Map.class);
                return m;
            }
        } catch (Exception ignored) {
            // 손상된 값 → 빈 객체로 복구
        }
        return Map.of();
    }

    /** 내 학습 진도 저장. 64KB 이하의 JSON 객체만 허용(과대 본문·형식 오류 차단). */
    @PutMapping(value = "/progress", consumes = "application/json")
    public Map<String, Object> put(Authentication auth, @RequestBody(required = false) String raw) {
        String body = (raw == null || raw.isBlank()) ? "{}" : raw;
        if (body.length() > MAX_PROGRESS_CHARS) {
            throw new IllegalArgumentException("진도 데이터가 너무 큽니다.");
        }
        JsonNode node;
        try {
            node = om.readTree(body);
        } catch (Exception e) {
            throw new IllegalArgumentException("진도 데이터 형식이 올바르지 않습니다.");
        }
        if (!node.isObject()) {
            throw new IllegalArgumentException("진도 데이터 형식이 올바르지 않습니다(JSON 객체 필요).");
        }
        repo.upsert(userId(auth), node.toString());
        return Map.of("ok", true);
    }
}
