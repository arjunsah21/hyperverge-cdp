package com.hyperverge.cdp.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.hyperverge.cdp.domain.Segment;
import com.hyperverge.cdp.web.Dtos;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiGenerationService {
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newHttpClient();

    @Value("${app.openai.api-key:}")
    private String apiKey;

    @Value("${app.openai.base-url:https://api.openai.com/v1}")
    private String baseUrl;

    @Value("${app.openai.model:gpt-4o-mini}")
    private String model;

    public Dtos.SegmentRequest generateSegment(String prompt) {
        if (apiKey == null || apiKey.isBlank()) {
            return fallbackSegment(prompt);
        }

        String instruction = """
                You are a CDP expert. Return only valid JSON for a customer segment.
                Shape: {"name":"...","description":"...","logic":"AND","is_dynamic":true,"rules":[{"field":"state","operator":"equals","value":"Texas"}]}
                Allowed fields: email, state, city, status, total_spend, total_orders, email_opt_in, source, last_order_date.
                Allowed operators: equals, not_equals, contains, greater_than, less_than, within_days.
                User request: %s
                """.formatted(prompt);

        try {
            String content = callOpenAi(instruction, 0.1);
            Dtos.SegmentRequest generated = objectMapper.readValue(content, Dtos.SegmentRequest.class);
            return normalizeSegment(generated);
        } catch (Exception exception) {
            log.warn("AI segment generation failed, using local fallback: {}", exception.getMessage());
            return fallbackSegment(prompt);
        }
    }

    public Dtos.FlowRequest generateFlow(String prompt, List<Segment> segments) {
        if (apiKey == null || apiKey.isBlank()) {
            return fallbackFlow(prompt, segments);
        }

        String segmentList = segments.stream()
                .map(segment -> "%d: %s - %s".formatted(segment.getId(), segment.getName(), segment.getDescription()))
                .reduce("", (left, right) -> left + "\n" + right);

        String instruction = """
                You are an e-commerce email marketer. Return only valid JSON for an email flow.
                Shape: {"name":"...","description":"...","trigger_type":"segment","segment_id":1,"status":"draft","steps":[{"order":1,"step_type":"email","subject":"...","content":"...","delay_days":0,"delay_hours":0}]}
                Existing segments:
                %s
                User request: %s
                """.formatted(segmentList, prompt);

        try {
            String content = callOpenAi(instruction, 0.3);
            Dtos.FlowRequest generated = objectMapper.readValue(content, Dtos.FlowRequest.class);
            return normalizeFlow(generated);
        } catch (Exception exception) {
            log.warn("AI flow generation failed, using local fallback: {}", exception.getMessage());
            return fallbackFlow(prompt, segments);
        }
    }

    private String callOpenAi(String prompt, double temperature) throws Exception {
        ObjectNode body = objectMapper.createObjectNode();
        body.put("model", model);
        body.put("temperature", temperature);
        body.putObject("response_format").put("type", "json_object");
        body.putArray("messages")
                .addObject()
                .put("role", "user")
                .put("content", prompt);

        String endpoint = baseUrl.endsWith("/") ? baseUrl + "chat/completions" : baseUrl + "/chat/completions";
        HttpRequest request = HttpRequest.newBuilder(URI.create(endpoint))
                .header("Authorization", "Bearer " + apiKey)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body), StandardCharsets.UTF_8))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new IllegalStateException("OpenAI API returned " + response.statusCode());
        }

        JsonNode root = objectMapper.readTree(response.body());
        JsonNode choices = root.path("choices");
        if (!choices.isArray() || choices.size() == 0) {
            throw new IllegalStateException("OpenAI API response had no choices");
        }
        return choices.get(0).path("message").path("content").asText();
    }

    private Dtos.SegmentRequest fallbackSegment(String prompt) {
        String lower = prompt == null ? "" : prompt.toLowerCase(Locale.ROOT);
        List<Dtos.SegmentRuleRequest> rules = new ArrayList<>();

        if (lower.contains("vip") || lower.contains("high value") || lower.contains("high-value")) {
            rules.add(new Dtos.SegmentRuleRequest("total_spend", "greater_than", "5000"));
        }
        if (lower.contains("gmail")) {
            rules.add(new Dtos.SegmentRuleRequest("email", "contains", "gmail.com"));
        }
        if (lower.contains("recent") || lower.contains("last 30")) {
            rules.add(new Dtos.SegmentRuleRequest("last_order_date", "within_days", "30"));
        }
        if (lower.contains("opt in") || lower.contains("email subscribers")) {
            rules.add(new Dtos.SegmentRuleRequest("email_opt_in", "equals", "true"));
        }

        for (String state : List.of("Texas", "California", "New York", "Florida", "Illinois")) {
            if (lower.contains(state.toLowerCase(Locale.ROOT))) {
                rules.add(new Dtos.SegmentRuleRequest("state", "equals", state));
            }
        }

        if (rules.isEmpty()) {
            rules.add(new Dtos.SegmentRuleRequest("status", "equals", lower.contains("churn") ? "CHURNED" : "ACTIVE"));
        }

        String name = prompt == null || prompt.isBlank() ? "AI Generated Segment" : title(prompt);
        return new Dtos.SegmentRequest(name, "Generated from: " + prompt, "AND", true, rules);
    }

    private Dtos.FlowRequest fallbackFlow(String prompt, List<Segment> segments) {
        String lower = prompt == null ? "" : prompt.toLowerCase(Locale.ROOT);
        Long segmentId = segments.stream()
                .filter(segment -> lower.contains(segment.getName().toLowerCase(Locale.ROOT)))
                .map(Segment::getId)
                .findFirst()
                .orElse(segments.isEmpty() ? null : segments.get(0).getId());

        String goal = prompt == null || prompt.isBlank() ? "Customer Engagement" : title(prompt);
        List<Dtos.FlowStepRequest> steps = List.of(
                new Dtos.FlowStepRequest(1, "email", "A quick note from HyperVerge", "Hi {{customer.first_name}}, thanks for being part of HyperVerge. Here is something picked for you.", 0, 0),
                new Dtos.FlowStepRequest(2, "email", "Still interested?", "We wanted to share a timely offer based on your recent activity.", 2, 0),
                new Dtos.FlowStepRequest(3, "email", "Last chance to take a look", "This is your final reminder before the offer expires.", 5, 0)
        );

        return new Dtos.FlowRequest(goal + " Flow", "Generated from: " + prompt, "segment", segmentId, "draft", steps);
    }

    private Dtos.SegmentRequest normalizeSegment(Dtos.SegmentRequest request) {
        List<Dtos.SegmentRuleRequest> rules = request.rules() == null ? List.of() : request.rules().stream()
                .map(rule -> new Dtos.SegmentRuleRequest(rule.field(), rule.operator(), String.valueOf(rule.value())))
                .toList();
        return new Dtos.SegmentRequest(
                blankDefault(request.name(), "AI Generated Segment"),
                request.description(),
                blankDefault(request.logic(), "AND"),
                request.isDynamic() == null || request.isDynamic(),
                rules
        );
    }

    private Dtos.FlowRequest normalizeFlow(Dtos.FlowRequest request) {
        return new Dtos.FlowRequest(
                blankDefault(request.name(), "AI Generated Flow"),
                request.description(),
                blankDefault(request.triggerType(), "segment"),
                request.segmentId(),
                blankDefault(request.status(), "draft"),
                request.steps() == null ? List.of() : request.steps()
        );
    }

    private String title(String value) {
        String trimmed = value.trim();
        return trimmed.length() <= 48 ? trimmed : trimmed.substring(0, 48);
    }

    private String blankDefault(String value, String defaultValue) {
        return value == null || value.isBlank() ? defaultValue : value;
    }
}
