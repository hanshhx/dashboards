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

    public AuthController(UserService users, JwtService jwt) {
        this.users = users;
        this.jwt = jwt;
    }

    @PostMapping("/signup")
    public Map<String, Object> signup(@RequestBody SignupReq req) {
        users.signup(req.username(), req.password());
        return Map.of("ok", true, "message", "가입 완료. 로그인 후 이용하세요. (기본 등급: 일반)");
    }

    @PostMapping("/login")
    public AuthResp login(@RequestBody LoginReq req) {
        AppUser u = users.authenticate(req.username(), req.password());
        return new AuthResp(jwt.generate(u.username(), u.role()), u.username(), u.role());
    }

    @GetMapping("/me")
    public MeResp me(Authentication auth) {
        AppUser u = users.findByUsername(auth.getName())
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        return new MeResp(u.username(), u.role(), u.enabled());
    }
}
