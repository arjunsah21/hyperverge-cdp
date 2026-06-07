package com.hyperverge.cdp.repository;

import com.hyperverge.cdp.domain.Insight;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InsightRepository extends JpaRepository<Insight, Long> {
    List<Insight> findAllByOrderByCreatedAtDesc();
}
