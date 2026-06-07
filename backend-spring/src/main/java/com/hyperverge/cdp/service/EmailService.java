package com.hyperverge.cdp.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class EmailService {
    public void sendVerificationEmail(String email, String code) {
        log.info("Verification code for {} is {}", email, code);
    }
}
