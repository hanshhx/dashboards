package com.jsycure.dashboard;

import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.Set;

/** 회원가입/로그인 검증 + 회원관리. 비밀번호는 BCrypt 해시 저장. */
@Service
public class UserService {

    static final Set<String> ROLES = Set.of("GENERAL", "STAFF", "ADMIN");

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
