package com.hyperverge.cdp.web;

import com.hyperverge.cdp.domain.Flow;
import com.hyperverge.cdp.domain.FlowStep;
import com.hyperverge.cdp.domain.Segment;
import com.hyperverge.cdp.repository.FlowRepository;
import com.hyperverge.cdp.repository.FlowStepRepository;
import com.hyperverge.cdp.repository.SegmentRepository;
import com.hyperverge.cdp.service.AiGenerationService;
import com.hyperverge.cdp.service.DtoMapper;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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

import java.util.List;
import java.util.Map;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@RestController
@RequestMapping("/api/flows")
@RequiredArgsConstructor
@Transactional
public class FlowsController {
    private final FlowRepository flowRepository;
    private final FlowStepRepository flowStepRepository;
    private final SegmentRepository segmentRepository;
    private final DtoMapper mapper;
    private final AiGenerationService aiGenerationService;

    @GetMapping
    @Transactional(readOnly = true)
    public Dtos.FlowListResponse flows(@RequestParam(required = false) String status) {
        List<Flow> flows = status == null || status.isBlank()
                ? flowRepository.findAllByOrderByCreatedAtDesc()
                : flowRepository.findByStatusOrderByCreatedAtDesc(status);
        return new Dtos.FlowListResponse(flows.stream().map(mapper::flow).toList(), flows.size());
    }

    @PostMapping("/ai-generate")
    @Transactional(readOnly = true)
    public Dtos.FlowRequest aiGenerate(@Valid @RequestBody Dtos.AiPromptRequest request) {
        return aiGenerationService.generateFlow(request.prompt(), segmentRepository.findAll());
    }

    @GetMapping("/{flowId}")
    @Transactional(readOnly = true)
    public Dtos.FlowResponse flow(@PathVariable Long flowId) {
        return mapper.flow(findFlow(flowId));
    }

    @PostMapping
    public Dtos.FlowResponse create(@Valid @RequestBody Dtos.FlowRequest request) {
        Flow flow = new Flow();
        apply(flow, request);
        return mapper.flow(flowRepository.save(flow));
    }

    @PutMapping("/{flowId}")
    public Dtos.FlowResponse update(@PathVariable Long flowId, @Valid @RequestBody Dtos.FlowUpdateRequest request) {
        Flow flow = findFlow(flowId);
        if (request.name() != null) flow.setName(request.name());
        if (request.description() != null) flow.setDescription(request.description());
        if (request.triggerType() != null) flow.setTriggerType(request.triggerType());
        if (request.status() != null) flow.setStatus(request.status());
        if (request.segmentId() != null) flow.setSegment(findSegment(request.segmentId()));
        return mapper.flow(flowRepository.save(flow));
    }

    @DeleteMapping("/{flowId}")
    public Map<String, String> delete(@PathVariable Long flowId) {
        flowRepository.delete(findFlow(flowId));
        return Map.of("message", "Flow deleted successfully");
    }

    @PostMapping("/{flowId}/steps")
    public Dtos.FlowStepResponse addStep(@PathVariable Long flowId, @Valid @RequestBody Dtos.FlowStepRequest request) {
        Flow flow = findFlow(flowId);
        FlowStep step = new FlowStep();
        apply(step, request);
        step.setFlow(flow);
        return mapper.flowStep(flowStepRepository.save(step));
    }

    @PutMapping("/{flowId}/steps/{stepId}")
    public Dtos.FlowStepResponse updateStep(@PathVariable Long flowId, @PathVariable Long stepId, @RequestBody Dtos.FlowStepRequest request) {
        FlowStep step = flowStepRepository.findByIdAndFlow_Id(stepId, flowId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Step not found"));
        apply(step, request);
        return mapper.flowStep(flowStepRepository.save(step));
    }

    @DeleteMapping("/{flowId}/steps/{stepId}")
    public Map<String, String> deleteStep(@PathVariable Long flowId, @PathVariable Long stepId) {
        FlowStep step = flowStepRepository.findByIdAndFlow_Id(stepId, flowId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Step not found"));
        flowStepRepository.delete(step);
        return Map.of("message", "Step deleted successfully");
    }

    private void apply(Flow flow, Dtos.FlowRequest request) {
        flow.setName(request.name());
        flow.setDescription(request.description());
        flow.setTriggerType(request.triggerType() == null ? "segment" : request.triggerType());
        flow.setStatus(request.status() == null ? "draft" : request.status());
        if (request.segmentId() != null) {
            flow.setSegment(findSegment(request.segmentId()));
        } else if ("segment".equals(flow.getTriggerType())) {
            flow.setSegment(null);
        }

        if (request.steps() != null) {
            flow.getSteps().clear();
            for (Dtos.FlowStepRequest stepRequest : request.steps()) {
                FlowStep step = new FlowStep();
                apply(step, stepRequest);
                step.setFlow(flow);
                flow.getSteps().add(step);
            }
        }
    }

    private void apply(FlowStep step, Dtos.FlowStepRequest request) {
        if (request.order() != null) step.setOrder(request.order());
        if (request.stepType() != null) step.setStepType(request.stepType());
        if (request.subject() != null) step.setSubject(request.subject());
        if (request.content() != null) step.setContent(request.content());
        if (request.delayDays() != null) step.setDelayDays(request.delayDays());
        if (request.delayHours() != null) step.setDelayHours(request.delayHours());
    }

    private Flow findFlow(Long flowId) {
        return flowRepository.findById(flowId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Flow not found"));
    }

    private Segment findSegment(Long segmentId) {
        return segmentRepository.findById(segmentId)
                .orElseThrow(() -> new ResponseStatusException(BAD_REQUEST, "Invalid segment_id"));
    }
}
