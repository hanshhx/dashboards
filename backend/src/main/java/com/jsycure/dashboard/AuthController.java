package com.jsycure.dashboard;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/** 회원가입 / 로그인 / 내 정보. (login·signup은 공개, me는 인증 필요) */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService users;
    private final JwtService jwt;
    private final AuditService audit;

    public AuthController(UserService users, JwtService jwt, AuditService audit) {
        this.users = users;
        this.jwt = jwt;
        this.audit = audit;
    }

    @PostMapping("/signup")
    public Map<String, Object> signup(@RequestBody SignupReq req) {
        users.signup(req.username(), req.password());
        return Map.of("ok", true, "message", "가입 완료. 로그인 후 이용하세요. (기본 등급: 일반)");
    }

    @PostMapping("/login")
    public AuthResp login(@RequestBody LoginReq req) {
        AppUser u = users.authenticate(req.username(), req.password());
        audit.record(u.username(), "LOGIN", "role=" + u.role());
        return new AuthResp(jwt.generate(u.username(), u.role()), u.username(), u.role());
    }

    /** 본인 비밀번호 변경 (프로필) */
    @PostMapping("/password")
    public Map<String, Object> changePassword(Authentication auth, @RequestBody ChangePasswordReq req) {
        users.changePassword(auth.getName(), req.currentPassword(), req.newPassword());
        audit.record(auth.getName(), "PASSWORD_CHANGE", "");
        return Map.of("ok", true);
    }

    @GetMapping("/me")
    public MeResp me(Authentication auth) {
        AppUser u = users.findByUsername(auth.getName())
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        return new MeResp(u.username(), u.role(), u.enabled());
    }
}
