package com.jsycure.dashboard;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/** Authorization: Bearer <jwt> 를 검증해 SecurityContext에 권한(ROLE_xxx) 주입. */
@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwt;
    private final UserRepository users; // GUEST 토큰의 실시간 생존(활성·미만료) 확인용

    public JwtAuthFilter(JwtService jwt, UserRepository users) {
        this.jwt = jwt;
        this.users = users;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {
        String auth = req.getHeader("Authorization");
        if (auth != null && auth.startsWith("Bearer ")) {
            try {
                Claims c = jwt.parse(auth.substring(7)).getPayload();
                String username = c.getSubject();
                String role = c.get("role", String.class);
                // GUEST(시연) 토큰은 매 요청마다 계정 생존 확인 → 관리자가 차단했거나 7일 만료면 즉시 인증 거부.
                if (username != null && role != null && !guestRevoked(username, role)) {
                    var token = new UsernamePasswordAuthenticationToken(
                            username, null, List.of(new SimpleGrantedAuthority("ROLE_" + role)));
                    SecurityContextHolder.getContext().setAuthentication(token);
                }
            } catch (Exception ignored) {
                // 유효하지 않은/만료된 토큰 → 익명으로 진행 (보호 엔드포인트에서 401)
            }
        }
        chain.doFilter(req, res);
    }

    /** GUEST 토큰만 DB로 생존 확인 — 비활성(차단)이거나 만료면 true(인증 거부). 일반 사용자는 항상 false(기존대로 빠름). */
    private boolean guestRevoked(String username, String role) {
        if (!"GUEST".equals(role)) return false;
        return users.findByUsername(username)
                .filter(u -> u.enabled())
                .filter(u -> u.expiresAt() == null || beforeNow(u.expiresAt()))
                .isEmpty();
    }

    private boolean beforeNow(String iso) {
        try { return java.time.Instant.now().isBefore(java.time.Instant.parse(iso)); }
        catch (Exception e) { return true; }
    }
}
