package com.hyperverge.cdp.service;

import com.hyperverge.cdp.domain.Customer;
import com.hyperverge.cdp.domain.Segment;
import com.hyperverge.cdp.domain.SegmentRule;
import com.hyperverge.cdp.repository.CustomerRepository;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class SegmentService {
    private final CustomerRepository customerRepository;

    public long countCustomers(Segment segment) {
        return customerRepository.count(specification(segment));
    }

    public Page<Customer> customers(Segment segment, int page, int perPage) {
        return customerRepository.findAll(specification(segment), PageRequest.of(Math.max(page - 1, 0), perPage));
    }

    public Specification<Customer> specification(Segment segment) {
        return (root, query, cb) -> {
            if (segment.getRules() == null || segment.getRules().isEmpty()) {
                return cb.conjunction();
            }

            List<Predicate> predicates = new ArrayList<>();
            for (SegmentRule rule : segment.getRules()) {
                Predicate predicate = predicateFor(root, cb, rule);
                if (predicate != null) {
                    predicates.add(predicate);
                }
            }

            if (predicates.isEmpty()) {
                return cb.conjunction();
            }

            Predicate[] array = predicates.toArray(Predicate[]::new);
            return "OR".equalsIgnoreCase(segment.getLogic()) ? cb.or(array) : cb.and(array);
        };
    }

    private Predicate predicateFor(Root<Customer> root, CriteriaBuilder cb, SegmentRule rule) {
        String property = customerProperty(rule.getField());
        if (property == null) {
            return null;
        }

        String operator = rule.getOperator() == null ? "equals" : rule.getOperator();
        String value = rule.getValue() == null ? "" : rule.getValue();

        return switch (operator) {
            case "equals" -> equalsPredicate(root, cb, property, value);
            case "not_equals" -> cb.not(equalsPredicate(root, cb, property, value));
            case "contains" -> cb.like(cb.lower(root.get(property).as(String.class)), "%" + value.toLowerCase(Locale.ROOT) + "%");
            case "greater_than" -> numberPredicate(root, cb, property, value, true);
            case "less_than" -> numberPredicate(root, cb, property, value, false);
            case "within_days" -> withinDaysPredicate(root, cb, property, value);
            case "before_date" -> beforeDatePredicate(root, cb, property, value);
            default -> null;
        };
    }

    private Predicate equalsPredicate(Root<Customer> root, CriteriaBuilder cb, String property, String value) {
        if ("true".equalsIgnoreCase(value) || "false".equalsIgnoreCase(value)) {
            return cb.equal(root.get(property), Boolean.parseBoolean(value));
        }
        Expression<String> expression = root.get(property).as(String.class);
        return cb.equal(expression, value);
    }

    private Predicate numberPredicate(Root<Customer> root, CriteriaBuilder cb, String property, String value, boolean greaterThan) {
        try {
            double number = Double.parseDouble(value);
            Expression<Double> expression = root.get(property).as(Double.class);
            return greaterThan ? cb.gt(expression, number) : cb.lt(expression, number);
        } catch (NumberFormatException ignored) {
            return null;
        }
    }

    private Predicate withinDaysPredicate(Root<Customer> root, CriteriaBuilder cb, String property, String value) {
        try {
            int days = Integer.parseInt(value);
            Expression<LocalDateTime> expression = root.get(property).as(LocalDateTime.class);
            return cb.greaterThanOrEqualTo(expression, LocalDateTime.now().minusDays(days));
        } catch (NumberFormatException ignored) {
            return null;
        }
    }

    private Predicate beforeDatePredicate(Root<Customer> root, CriteriaBuilder cb, String property, String value) {
        try {
            Expression<LocalDateTime> expression = root.get(property).as(LocalDateTime.class);
            return cb.lessThan(expression, LocalDateTime.parse(value));
        } catch (Exception ignored) {
            return null;
        }
    }

    private String customerProperty(String field) {
        if (field == null) {
            return null;
        }
        return switch (field) {
            case "email" -> "email";
            case "first_name" -> "firstName";
            case "last_name" -> "lastName";
            case "phone" -> "phone";
            case "city" -> "city";
            case "state" -> "state";
            case "country" -> "country";
            case "zip_code" -> "zipCode";
            case "status" -> "status";
            case "total_orders" -> "totalOrders";
            case "total_spend" -> "totalSpend";
            case "lifetime_value" -> "lifetimeValue";
            case "email_opt_in" -> "emailOptIn";
            case "sms_opt_in" -> "smsOptIn";
            case "source" -> "source";
            case "last_order_date" -> "lastOrderDate";
            case "first_order_date" -> "firstOrderDate";
            case "created_at" -> "createdAt";
            default -> null;
        };
    }
}
