package com.jsycure.dashboard;

/*
 * 인증/회원 관련 DTO (Java record). 비밀번호 해시는 클라이언트로 절대 내보내지 않음.
 * 권한 등급: GENERAL(일반) < STAFF(관계자) < ADMIN(관리자).
 * GUEST(게스트)=시연용 — 관계자 수준 조회만 허용, 관리 기능 차단, 7일 후 만료.
 */

/** 회원가입 요청 */
record SignupReq(String username, String password) {}

/** 로그인 요청 */
record LoginReq(String username, String password) {}

/** 로그인 응답 (JWT + 표시용 정보) */
record AuthResp(String token, String username, String role) {}

/** 내 정보 응답 */
record MeResp(String username, String role, boolean enabled) {}

/** app_user 1행 (내부용 — password=BCrypt 해시 포함). expiresAt=게스트 만료시각(일반 사용자는 null) */
record AppUser(Long id, String username, String password, String role, boolean enabled, String createdAt, String expiresAt) {}

/** 회원관리 목록 1행 (password 제외). expiresAt=게스트 만료시각(일반 사용자는 null) */
record UserRow(Long id, String username, String role, boolean enabled, String createdAt, String expiresAt) {}

/** 비밀번호 변경 요청 (프로필) */
record ChangePasswordReq(String currentPassword, String newPassword) {}
