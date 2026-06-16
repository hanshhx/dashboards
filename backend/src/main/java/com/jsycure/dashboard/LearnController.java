package com.jsycure.dashboard;

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

    /** 내 학습 진도 불러오기. 저장된 것이 없으면 빈 객체. */
    @GetMapping("/progress")
    public Map<String, Object> get(Authentication auth) throws Exception {
        String json = repo.findByUserId(userId(auth)).orElse("{}");
        @SuppressWarnings("unchecked")
        Map<String, Object> m = om.readValue(json, Map.class);
        return m;
    }

    /** 내 학습 진도 저장(클라이언트가 병합한 전체 스냅샷을 통째로 보관). */
    @PutMapping("/progress")
    public Map<String, Object> put(Authentication auth, @RequestBody(required = false) Map<String, Object> body) throws Exception {
        repo.upsert(userId(auth), om.writeValueAsString(body == null ? Map.of() : body));
        return Map.of("ok", true);
    }
}
