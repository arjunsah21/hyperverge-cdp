package com.hyperverge.cdp.repository;

import com.hyperverge.cdp.domain.Flow;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FlowRepository extends JpaRepository<Flow, Long> {
    List<Flow> findByStatusOrderByCreatedAtDesc(String status);
    List<Flow> findAllByOrderByCreatedAtDesc();
}
