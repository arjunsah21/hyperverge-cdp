package com.hyperverge.cdp.repository;

import com.hyperverge.cdp.domain.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
}
