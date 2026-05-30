package com.jsycure.dashboard;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

/**
 * 간단한 API 키 보호 (Funnel 등으로 공개될 때 사용).
 * - app.api-key(환경변수 API_KEY)가 비어 있으면 비활성 → 로컬/개발에선 그냥 통과.
 * - 설정되어 있으면 /api/** 요청에 X-API-Key 헤더가 일치해야 통과.
 * - /api/health 는 항상 허용(라이브니스 체크).
 */
@Component
@Order(1)
public class ApiKeyFilter implements Filter {

    private final String apiKey;

    public ApiKeyFilter(@Value("${app.api-key:}") String apiKey) {
        this.apiKey = apiKey == null ? "" : apiKey.trim();
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse res = (HttpServletResponse) response;
        String path = req.getRequestURI();

        boolean needAuth = !apiKey.isEmpty()
                && path.startsWith("/api/")
                && !path.equals("/api/health");

        if (needAuth && !matches(req.getHeader("X-API-Key"))) {
            res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            res.setContentType("application/json;charset=UTF-8");
            res.getWriter().write("{\"error\":\"unauthorized\",\"message\":\"invalid or missing X-API-Key\"}");
            return;
        }
        chain.doFilter(request, response);
    }

    private boolean matches(String provided) {
        if (provided == null) return false;
        // 길이/내용 상수시간 비교
        return MessageDigest.isEqual(
                provided.getBytes(StandardCharsets.UTF_8),
                apiKey.getBytes(StandardCharsets.UTF_8));
    }
}
