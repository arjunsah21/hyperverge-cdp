package com.hyperverge.cdp.web;

import com.hyperverge.cdp.domain.CustomerOrder;
import com.hyperverge.cdp.repository.OrderRepository;
import com.hyperverge.cdp.service.DtoMapper;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OrdersController {
    private final OrderRepository orderRepository;
    private final DtoMapper mapper;

    @GetMapping
    public Dtos.OrderListResponse orders(
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "per_page", defaultValue = "10") int perPage,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(name = "sort_by", defaultValue = "date") String sortBy,
            @RequestParam(name = "sort_order", defaultValue = "desc") String sortOrder
    ) {
        Sort sort = Sort.by("desc".equalsIgnoreCase(sortOrder) ? Sort.Direction.DESC : Sort.Direction.ASC, orderSort(sortBy));
        Page<CustomerOrder> result = orderRepository.findAll(orderSpec(search, status), PageRequest.of(Math.max(page - 1, 0), perPage, sort));
        return new Dtos.OrderListResponse(result.getContent().stream().map(mapper::order).toList(), result.getTotalElements(), page, perPage);
    }

    @GetMapping("/{orderId}")
    public Map<String, Object> orderDetails(@PathVariable Long orderId) {
        CustomerOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Order not found"));

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", order.getId());
        response.put("order_id", order.getOrderId());
        response.put("date", order.getDate());
        response.put("status", order.getStatus());
        response.put("total_amount", order.getTotalAmount());
        response.put("shipping_address", order.getShippingAddress());
        response.put("items", order.getItems().stream().map(item -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("product_id", item.getProduct().getId());
            map.put("product_name", item.getProduct().getName());
            map.put("sku", item.getProduct().getSku());
            map.put("quantity", item.getQuantity());
            map.put("price", item.getPriceAtPurchase());
            map.put("total", Math.round(item.getQuantity() * item.getPriceAtPurchase() * 100.0) / 100.0);
            map.put("image_url", item.getProduct().getImageUrl());
            return map;
        }).toList());
        response.put("items_count", order.getItems().size());

        Map<String, Object> customer = new LinkedHashMap<>();
        customer.put("id", order.getCustomer().getId());
        customer.put("name", mapper.customerName(order.getCustomer()));
        customer.put("email", order.getCustomer().getEmail());
        customer.put("phone", order.getCustomer().getPhone());
        customer.put("avatar_url", order.getCustomer().getAvatarUrl());
        customer.put("status", order.getCustomer().getStatus());
        customer.put("initials", mapper.initials(order.getCustomer()));
        response.put("customer", customer);
        return response;
    }

    private Specification<CustomerOrder> orderSpec(String search, String status) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (search != null && !search.isBlank()) {
                String like = "%" + search.toLowerCase() + "%";
                var customer = root.join("customer", JoinType.LEFT);
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("orderId").as(String.class)), like),
                        cb.like(cb.lower(customer.get("firstName").as(String.class)), like),
                        cb.like(cb.lower(customer.get("lastName").as(String.class)), like),
                        cb.like(cb.lower(customer.get("email").as(String.class)), like)
                ));
            }
            if (status != null && !status.isBlank()) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };
    }

    private String orderSort(String sortBy) {
        return switch (sortBy) {
            case "total_amount" -> "totalAmount";
            case "order_id" -> "orderId";
            default -> "date";
        };
    }
}
