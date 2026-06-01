package com.jsycure.dashboard;

import org.springframework.web.bind.annotation.*;

/** IP/시그니처 드릴다운 분석 (관계자+ — SecurityConfig에서 /api/analysis/** 강제). */
@RestController
@RequestMapping("/api/analysis")
public class AnalysisController {

    private final EventService service;

    public AnalysisController(EventService service) {
        this.service = service;
    }

    /** 특정 IP의 공격자 프로파일 */
    @GetMapping("/ip")
    public IpProfileDto ip(@RequestParam String ip) {
        return service.ipProfile(ip);
    }

    /** 특정 시그니처(탐지 룰)의 프로파일 */
    @GetMapping("/signature")
    public SignatureProfileDto signature(@RequestParam String sig) {
        return service.signatureProfile(sig);
    }

    /** MITRE ATT&CK 전술 매트릭스 */
    @GetMapping("/attack-matrix")
    public AttackMatrix attackMatrix() {
        return service.attackMatrix();
    }
}
