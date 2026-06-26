package com.jsycure.dashboard;

import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

/** 회원가입/로그인 검증 + 회원관리. 비밀번호는 BCrypt 해시 저장. */
@Service
public class UserService {

    static final Set<String> ROLES = Set.of("GENERAL", "STAFF", "ADMIN");
    static final String GUEST_USERNAME = "guest"; // 공용 게스트(시연) 계정 아이디

    private final UserRepository repo;
    private final PasswordEncoder encoder;

    public UserService(UserRepository repo, PasswordEncoder encoder) {
        this.repo = repo;
        this.encoder = encoder;
    }

    /** 회원가입 — 신규는 항상 GENERAL(일반)로 생성, 관리자가 승급. */
    public void signup(String username, String password) {
        validate(username, password);
        if (repo.existsByUsername(username)) {
            throw new IllegalArgumentException("이미 사용 중인 아이디입니다.");
        }
        repo.insert(username, encoder.encode(password), "GENERAL");
    }

    /** 로그인 검증 — 성공 시 AppUser 반환. */
    public AppUser authenticate(String username, String password) {
        AppUser u = repo.findByUsername(username == null ? "" : username)
                .orElseThrow(() -> new BadCredentialsException("아이디 또는 비밀번호가 올바르지 않습니다."));
        if (!u.enabled()) {
            throw new DisabledException("비활성화된 계정입니다. 관리자에게 문의하세요.");
        }
        if (!encoder.matches(password == null ? "" : password, u.password())) {
            throw new BadCredentialsException("아이디 또는 비밀번호가 올바르지 않습니다.");
        }
        return u;
    }

    public Optional<AppUser> findByUsername(String username) {
        return repo.findByUsername(username);
    }

    public List<AppUser> all() {
        return repo.findAll();
    }

    public void changeRole(long id, String role) {
        if (role == null || !ROLES.contains(role)) {
            throw new IllegalArgumentException("권한 값이 올바르지 않습니다. (GENERAL|STAFF|ADMIN)");
        }
        repo.updateRole(id, role);
    }

    public void delete(long id) {
        repo.delete(id);
    }

    // ── 게스트(시연) 모드 ─────────────────────────────────────────────
    /** 시작 시 공용 게스트 계정 보장(없으면 생성). GUEST 등급·활성·7일 만료. */
    public void ensureGuestAccount() {
        if (repo.findByUsername(GUEST_USERNAME).isEmpty()) {
            // 비번으로 직접 로그인하지 않지만 컬럼이 NOT NULL이라 임의 해시를 저장(직접 로그인 불가).
            repo.insertGuest(GUEST_USERNAME, encoder.encode(UUID.randomUUID().toString()));
        }
    }

    /** 게스트 로그인 — 활성·미만료일 때만 게스트 계정 반환. */
    public AppUser guestLogin() {
        AppUser g = repo.findByUsername(GUEST_USERNAME)
                .orElseThrow(() -> new DisabledException("게스트 모드를 사용할 수 없습니다."));
        if (!isActive(g)) {
            throw new DisabledException("게스트 모드가 종료되었습니다. 회원가입 후 일반 모드로 이용하세요.");
        }
        return g;
    }

    /** 계정 활성 여부 — enabled + (만료 없음 또는 아직 안 지남). 게스트 만료/차단 판정에 사용. */
    public boolean isActive(AppUser u) {
        if (u == null || !u.enabled()) return false;
        if (u.expiresAt() == null) return true;
        try { return Instant.now().isBefore(Instant.parse(u.expiresAt())); }
        catch (Exception e) { return true; }
    }

    /** 게스트 즉시 차단(비활성화) — 다음 요청부터 막힘. */
    public void blockGuest() {
        repo.findByUsername(GUEST_USERNAME).ifPresent(g -> repo.setEnabled(g.id(), false));
    }

    /** 게스트 재활성 + 만료 7일 연장. */
    public void renewGuest() {
        AppUser g = repo.findByUsername(GUEST_USERNAME)
                .orElseThrow(() -> new IllegalArgumentException("게스트 계정이 없습니다."));
        repo.renewGuest(g.id());
    }

    /** 본인 비밀번호 변경 (현재 비번 확인 후) */
    public void changePassword(String username, String current, String next) {
        AppUser u = repo.findByUsername(username)
                .orElseThrow(() -> new BadCredentialsException("사용자를 찾을 수 없습니다."));
        if (!encoder.matches(current == null ? "" : current, u.password())) {
            throw new BadCredentialsException("현재 비밀번호가 올바르지 않습니다.");
        }
        if (next == null || next.length() < 8) {
            throw new IllegalArgumentException("새 비밀번호는 8자 이상이어야 합니다.");
        }
        repo.updatePassword(u.id(), encoder.encode(next));
    }

    private void validate(String username, String password) {
        if (username == null || !username.matches("[A-Za-z0-9_]{3,20}")) {
            throw new IllegalArgumentException("아이디는 영문/숫자/_ 3~20자여야 합니다.");
        }
        if (password == null || password.length() < 8) {
            throw new IllegalArgumentException("비밀번호는 8자 이상이어야 합니다.");
        }
    }
}
