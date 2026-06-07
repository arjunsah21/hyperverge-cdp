package com.hyperverge.cdp.web;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class RootController {
    @GetMapping("/")
    public Map<String, Object> root() {
        return Map.of(
                "message", "HyperVerge CDP & E-Commerce Dashboard API",
                "version", "spring-1.0.0",
                "health", "/actuator/health"
        );
    }
}
