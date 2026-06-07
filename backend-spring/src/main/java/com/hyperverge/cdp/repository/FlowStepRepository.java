package com.hyperverge.cdp.repository;

import com.hyperverge.cdp.domain.FlowStep;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface FlowStepRepository extends JpaRepository<FlowStep, Long> {
    Optional<FlowStep> findByIdAndFlow_Id(Long id, Long flowId);
}
