package com.jsycure.dashboard;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * 권한 등급별 접근 제어 (차등 노출의 서버측 강제):
 *  - 공개:        /api/health, POST /api/auth/login·signup
 *  - 일반(GENERAL): 개요 요약 (overview·timeseries·protocols·alerts), /api/auth/me
 *  - 관계자(STAFF): + 로그탐색(/api/events**), 시그니처, Top Talkers
 *  - 관리자(ADMIN): + payload 상세(/api/events/{id}/payload), 회원관리(/api/admin/**)
 * 토큰은 JWT(무상태). API 키 필터(ApiKeyFilter)는 프록시-백엔드 채널 보호로 별도 동작.
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthFilter jwtFilter;

    public SecurityConfig(JwtAuthFilter jwtFilter) {
        this.jwtFilter = jwtFilter;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(c -> c.disable())
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(a -> a
                .requestMatchers("/api/health").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/auth/login", "/api/auth/signup").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/events/*/payload").hasRole("ADMIN")
                .requestMatchers("/api/events/**").hasAnyRole("STAFF", "ADMIN")
                .requestMatchers("/api/stats/signatures", "/api/stats/top-talkers").hasAnyRole("STAFF", "ADMIN")
                .anyRequest().authenticated())
            .exceptionHandling(e -> e
                .authenticationEntryPoint((req, res, ex) -> {
                    res.setStatus(401);
                    res.setContentType("application/json;charset=UTF-8");
                    res.getWriter().write("{\"error\":\"unauthorized\",\"message\":\"로그인이 필요합니다.\"}");
                })
                .accessDeniedHandler((req, res, ex) -> {
                    res.setStatus(403);
                    res.setContentType("application/json;charset=UTF-8");
                    res.getWriter().write("{\"error\":\"forbidden\",\"message\":\"접근 권한이 없습니다.\"}");
                }))
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
