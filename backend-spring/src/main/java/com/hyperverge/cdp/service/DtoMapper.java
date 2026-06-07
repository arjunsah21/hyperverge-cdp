package com.hyperverge.cdp.service;

import com.hyperverge.cdp.domain.Customer;
import com.hyperverge.cdp.domain.CustomerOrder;
import com.hyperverge.cdp.domain.Flow;
import com.hyperverge.cdp.domain.FlowStep;
import com.hyperverge.cdp.domain.Insight;
import com.hyperverge.cdp.domain.Product;
import com.hyperverge.cdp.domain.Segment;
import com.hyperverge.cdp.domain.SegmentRule;
import com.hyperverge.cdp.domain.User;
import com.hyperverge.cdp.web.Dtos;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DtoMapper {
    private final ProductNeedService productNeedService;

    public Dtos.UserResponse user(User user) {
        return new Dtos.UserResponse(
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getAvatarUrl(),
                user.getRole(),
                user.getIsActive(),
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }

    public Dtos.CustomerResponse customer(Customer customer) {
        return new Dtos.CustomerResponse(
                customer.getId(),
                customer.getEmail(),
                customer.getFirstName(),
                customer.getLastName(),
                customerName(customer),
                customer.getPhone(),
                customer.getAvatarUrl(),
                customer.getCity(),
                customer.getState(),
                customer.getCountry(),
                customer.getZipCode(),
                customer.getStatus(),
                value(customer.getTotalOrders()),
                money(customer.getTotalSpend()),
                money(customer.getLifetimeValue()),
                money(customer.getAverageOrderValue()),
                customer.getFirstOrderDate(),
                customer.getLastOrderDate(),
                Boolean.TRUE.equals(customer.getEmailOptIn()),
                Boolean.TRUE.equals(customer.getSmsOptIn()),
                customer.getSource(),
                customer.getTags() == null ? List.of() : customer.getTags(),
                customer.getCreatedAt(),
                customer.getUpdatedAt()
        );
    }

    public Dtos.OrderResponse order(CustomerOrder order) {
        return new Dtos.OrderResponse(
                order.getId(),
                order.getOrderId(),
                order.getCustomer().getId(),
                customerName(order.getCustomer()),
                initials(order.getCustomer()),
                order.getDate(),
                order.getStatus(),
                money(order.getTotalAmount())
        );
    }

    public Dtos.ProductResponse product(Product product) {
        return new Dtos.ProductResponse(
                product.getId(),
                product.getName(),
                product.getSku(),
                product.getImageUrl(),
                value(product.getStockLevel()),
                money(product.getPrice()),
                product.getStatus(),
                productNeedService.predictedNeed(product.getStockLevel()),
                product.getCategory(),
                product.getCreatedAt()
        );
    }

    public Dtos.SegmentResponse segment(Segment segment, long customerCount) {
        return new Dtos.SegmentResponse(
                segment.getId(),
                segment.getName(),
                segment.getDescription(),
                segment.getLogic(),
                segment.getIsDynamic(),
                customerCount,
                segment.getRules().stream().map(this::segmentRule).toList(),
                segment.getCreatedAt(),
                segment.getUpdatedAt()
        );
    }

    public Dtos.SegmentRuleResponse segmentRule(SegmentRule rule) {
        return new Dtos.SegmentRuleResponse(
                rule.getId(),
                rule.getSegment().getId(),
                rule.getField(),
                rule.getOperator(),
                rule.getValue(),
                rule.getCreatedAt()
        );
    }

    public Dtos.FlowResponse flow(Flow flow) {
        Long segmentId = flow.getSegment() == null ? null : flow.getSegment().getId();
        return new Dtos.FlowResponse(
                flow.getId(),
                flow.getName(),
                flow.getDescription(),
                flow.getTriggerType(),
                segmentId,
                flow.getStatus(),
                value(flow.getTotalSent()),
                value(flow.getTotalOpened()),
                value(flow.getTotalClicked()),
                flow.getSteps().stream()
                        .sorted(Comparator.comparing(FlowStep::getOrder))
                        .map(this::flowStep)
                        .toList(),
                flow.getCreatedAt(),
                flow.getUpdatedAt()
        );
    }

    public Dtos.FlowStepResponse flowStep(FlowStep step) {
        return new Dtos.FlowStepResponse(
                step.getId(),
                step.getFlow().getId(),
                step.getOrder(),
                step.getStepType(),
                step.getSubject(),
                step.getContent(),
                value(step.getDelayDays()),
                value(step.getDelayHours()),
                value(step.getSentCount()),
                value(step.getOpenCount()),
                value(step.getClickCount()),
                step.getCreatedAt()
        );
    }

    public Dtos.InsightResponse insight(Insight insight) {
        return new Dtos.InsightResponse(
                insight.getId(),
                insight.getTitle(),
                insight.getDescription(),
                insight.getType(),
                insight.getIcon(),
                insight.getTimeAgo()
        );
    }

    public String customerName(Customer customer) {
        if (customer.getFirstName() != null && customer.getLastName() != null) {
            return customer.getFirstName() + " " + customer.getLastName();
        }
        if (customer.getFirstName() != null) {
            return customer.getFirstName();
        }
        if (customer.getLastName() != null) {
            return customer.getLastName();
        }
        return customer.getEmail() == null ? "Unknown Customer" : customer.getEmail().split("@")[0];
    }

    public String initials(Customer customer) {
        String first = customer.getFirstName();
        String last = customer.getLastName();
        if (first != null && !first.isBlank() && last != null && !last.isBlank()) {
            return (first.substring(0, 1) + last.substring(0, 1)).toUpperCase();
        }
        if (first != null && first.length() >= 2) {
            return first.substring(0, 2).toUpperCase();
        }
        if (last != null && last.length() >= 2) {
            return last.substring(0, 2).toUpperCase();
        }
        return "??";
    }

    private int value(Integer value) {
        return value == null ? 0 : value;
    }

    private double money(Double value) {
        return value == null ? 0.0 : Math.round(value * 100.0) / 100.0;
    }
}
