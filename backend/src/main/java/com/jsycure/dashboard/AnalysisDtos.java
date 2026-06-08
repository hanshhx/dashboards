package com.jsycure.dashboard;

import java.util.List;

/* IP/시그니처 드릴다운 분석 + 감사 로그 DTO */

/** 특정 출발/목적 IP 프로파일 */
record IpProfileDto(
        String ip,
        long total,
        long asSrc,
        long asDest,
        List<CountItem> bySeverity,
        List<CountItem> topSignatures,
        List<CountItem> topPorts,
        List<CountItem> timeline
) {}

/** 특정 시그니처(탐지 룰) 프로파일 */
record SignatureProfileDto(
        String signature,
        long total,
        List<CountItem> bySeverity,
        List<CountItem> topSrcIps,
        List<CountItem> topPorts,
        List<CountItem> timeline
) {}

/** 감사 로그 1건 */
record AuditEntry(Long id, String at, String username, String action, String detail) {}
