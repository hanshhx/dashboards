package com.jsycure.dashboard;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/**
 * 시작 시 공용 게스트(시연) 계정이 없으면 생성한다.
 * DB가 잠깐 닿지 않아도 부팅을 막지 않도록 예외는 삼키고 경고만 남긴다(이후 게스트 로그인 시 재시도 가능).
 */
@Component
class GuestInitializer implements ApplicationRunner {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(GuestInitializer.class);
    private final UserService users;

    GuestInitializer(UserService users) {
        this.users = users;
    }

    @Override
    public void run(ApplicationArguments args) {
        try {
            users.ensureGuestAccount();
        } catch (Exception e) {
            log.warn("게스트 계정 준비 실패(무시): {}", e.getClass().getSimpleName());
        }
    }
}
