package com.hyperverge.cdp.web;

import com.hyperverge.cdp.domain.Segment;
import com.hyperverge.cdp.domain.SegmentRule;
import com.hyperverge.cdp.repository.SegmentRepository;
import com.hyperverge.cdp.service.AiGenerationService;
import com.hyperverge.cdp.service.DtoMapper;
import com.hyperverge.cdp.service.SegmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.Comparator;
import java.util.List;
import java.util.Map;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@RestController
@RequestMapping("/api/segments")
@RequiredArgsConstructor
@Transactional
public class SegmentsController {
    private final SegmentRepository segmentRepository;
    private final SegmentService segmentService;
    private final DtoMapper mapper;
    private final AiGenerationService aiGenerationService;

    @GetMapping
    @Transactional(readOnly = true)
    public Dtos.SegmentListResponse segments() {
        List<Dtos.SegmentResponse> segments = segmentRepository.findAll().stream()
                .sorted(Comparator.comparing(Segment::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(segment -> mapper.segment(segment, segmentService.countCustomers(segment)))
                .toList();
        return new Dtos.SegmentListResponse(segments, segments.size());
    }

    @PostMapping("/ai-generate")
    @Transactional(readOnly = true)
    public Dtos.SegmentRequest aiGenerate(@Valid @RequestBody Dtos.AiPromptRequest request) {
        return aiGenerationService.generateSegment(request.prompt());
    }

    @GetMapping("/{segmentId}")
    @Transactional(readOnly = true)
    public Dtos.SegmentResponse segment(@PathVariable Long segmentId) {
        Segment segment = findSegment(segmentId);
        return mapper.segment(segment, segmentService.countCustomers(segment));
    }

    @GetMapping("/{segmentId}/customers")
    @Transactional(readOnly = true)
    public Dtos.SegmentCustomersResponse segmentCustomers(
            @PathVariable Long segmentId,
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "per_page", defaultValue = "10") int perPage
    ) {
        Segment segment = findSegment(segmentId);
        Page<com.hyperverge.cdp.domain.Customer> customers = segmentService.customers(segment, page, perPage);
        return new Dtos.SegmentCustomersResponse(
                mapper.segment(segment, customers.getTotalElements()),
                customers.getContent().stream().map(mapper::customer).toList(),
                customers.getTotalElements(),
                page,
                perPage
        );
    }

    @PostMapping
    public Dtos.SegmentResponse create(@Valid @RequestBody Dtos.SegmentRequest request) {
        Segment segment = new Segment();
        apply(segment, request);
        Segment saved = segmentRepository.save(segment);
        return mapper.segment(saved, segmentService.countCustomers(saved));
    }

    @PutMapping("/{segmentId}")
    public Dtos.SegmentResponse update(@PathVariable Long segmentId, @Valid @RequestBody Dtos.SegmentRequest request) {
        Segment segment = findSegment(segmentId);
        apply(segment, request);
        Segment saved = segmentRepository.save(segment);
        return mapper.segment(saved, segmentService.countCustomers(saved));
    }

    @DeleteMapping("/{segmentId}")
    public Map<String, String> delete(@PathVariable Long segmentId) {
        segmentRepository.delete(findSegment(segmentId));
        return Map.of("message", "Segment deleted successfully");
    }

    private void apply(Segment segment, Dtos.SegmentRequest request) {
        if (request.name() != null) segment.setName(request.name());
        if (request.description() != null) segment.setDescription(request.description());
        segment.setLogic(request.logic() == null ? "AND" : request.logic());
        segment.setIsDynamic(request.isDynamic() == null || request.isDynamic());

        if (request.rules() != null) {
            segment.getRules().clear();
            for (Dtos.SegmentRuleRequest ruleRequest : request.rules()) {
                SegmentRule rule = new SegmentRule();
                rule.setSegment(segment);
                rule.setField(ruleRequest.field());
                rule.setOperator(ruleRequest.operator());
                rule.setValue(ruleRequest.value());
                segment.getRules().add(rule);
            }
        }
    }

    private Segment findSegment(Long segmentId) {
        return segmentRepository.findById(segmentId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Segment not found"));
    }
}
