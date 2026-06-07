package com.hyperverge.cdp.web;

import com.hyperverge.cdp.domain.Customer;
import com.hyperverge.cdp.domain.CustomerOrder;
import com.hyperverge.cdp.domain.OrderItem;
import com.hyperverge.cdp.repository.CustomerRepository;
import com.hyperverge.cdp.repository.OrderRepository;
import com.hyperverge.cdp.service.DtoMapper;
import jakarta.persistence.criteria.Predicate;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
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

import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@RestController
@RequestMapping("/api/customers")
@RequiredArgsConstructor
@Transactional
public class CustomersController {
    private final CustomerRepository customerRepository;
    private final OrderRepository orderRepository;
    private final DtoMapper mapper;

    @GetMapping
    @Transactional(readOnly = true)
    public Dtos.CustomerListResponse customers(
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "per_page", defaultValue = "10") int perPage,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String source,
            @RequestParam(name = "email_opt_in", required = false) Boolean emailOptIn,
            @RequestParam(name = "sort_by", defaultValue = "total_spend") String sortBy,
            @RequestParam(name = "sort_order", defaultValue = "desc") String sortOrder
    ) {
        Sort sort = Sort.by("desc".equalsIgnoreCase(sortOrder) ? Sort.Direction.DESC : Sort.Direction.ASC, customerSort(sortBy));
        Page<Customer> result = customerRepository.findAll(customerSpec(search, status, state, source, emailOptIn), PageRequest.of(Math.max(page - 1, 0), perPage, sort));
        return new Dtos.CustomerListResponse(result.getContent().stream().map(mapper::customer).toList(), result.getTotalElements(), page, perPage);
    }

    @GetMapping("/states")
    @Transactional(readOnly = true)
    public List<String> states() {
        return customerRepository.findDistinctStates();
    }

    @GetMapping("/sources")
    @Transactional(readOnly = true)
    public List<String> sources() {
        return customerRepository.findDistinctSources();
    }

    @GetMapping("/{customerId}")
    @Transactional(readOnly = true)
    public Dtos.CustomerResponse customer(@PathVariable Long customerId) {
        return mapper.customer(findCustomer(customerId));
    }

    @GetMapping("/{customerId}/details")
    @Transactional(readOnly = true)
    public Dtos.CustomerDetailsResponse details(@PathVariable Long customerId) {
        Customer customer = findCustomer(customerId);
        List<CustomerOrder> orders = orderRepository.findByCustomerIdOrderByDateDesc(customerId);
        List<Map<String, Object>> orderData = orders.stream().map(order -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", order.getId());
            map.put("order_id", order.getOrderId());
            map.put("date", order.getDate());
            map.put("status", order.getStatus());
            map.put("total_amount", order.getTotalAmount());
            map.put("items", order.getItems().stream().map(item -> {
                Map<String, Object> itemMap = new LinkedHashMap<>();
                itemMap.put("product_name", item.getProduct().getName());
                itemMap.put("quantity", item.getQuantity());
                itemMap.put("price", item.getPriceAtPurchase());
                itemMap.put("image_url", item.getProduct().getImageUrl());
                return itemMap;
            }).toList());
            return map;
        }).toList();

        List<OrderItem> items = orders.stream().flatMap(order -> order.getItems().stream()).toList();
        Map<String, Integer> quantityByProduct = new HashMap<>();
        Map<String, Double> valueByProduct = new HashMap<>();
        for (OrderItem item : items) {
            quantityByProduct.merge(item.getProduct().getName(), item.getQuantity(), Integer::sum);
            valueByProduct.merge(item.getProduct().getName(), item.getQuantity() * item.getPriceAtPurchase(), Double::sum);
        }

        Map<String, Object> insights = new LinkedHashMap<>();
        insights.put("top_products_by_quantity", topEntries(quantityByProduct));
        insights.put("top_products_by_value", topMoneyEntries(valueByProduct));
        insights.put("order_status_breakdown", orders.stream().collect(Collectors.groupingBy(CustomerOrder::getStatus, Collectors.counting())));
        insights.put("monthly_spending", monthlySpending(orders));
        insights.put("engagement", Map.of(
                "days_since_first_order", customer.getFirstOrderDate() == null ? 0 : java.time.Duration.between(customer.getFirstOrderDate(), java.time.LocalDateTime.now()).toDays(),
                "days_since_last_order", customer.getLastOrderDate() == null ? 0 : java.time.Duration.between(customer.getLastOrderDate(), java.time.LocalDateTime.now()).toDays(),
                "order_frequency", customer.getTotalOrders() == null ? 0.0 : Math.round((customer.getTotalOrders() / Math.max(java.time.Duration.between(customer.getCreatedAt(), java.time.LocalDateTime.now()).toDays() / 30.0, 1.0)) * 100.0) / 100.0,
                "email_engaged", Boolean.TRUE.equals(customer.getEmailOptIn()),
                "sms_engaged", Boolean.TRUE.equals(customer.getSmsOptIn())
        ));
        insights.put("tier", tier(customer.getTotalSpend()));

        return new Dtos.CustomerDetailsResponse(mapper.customer(customer), orderData, insights);
    }

    @PostMapping
    public Dtos.CustomerResponse create(@Valid @RequestBody Dtos.CustomerRequest request) {
        if (customerRepository.existsByEmail(request.email())) {
            throw new ResponseStatusException(BAD_REQUEST, "Email already registered");
        }
        Customer customer = new Customer();
        apply(customer, request);
        return mapper.customer(customerRepository.save(customer));
    }

    @PutMapping("/{customerId}")
    public Dtos.CustomerResponse update(@PathVariable Long customerId, @RequestBody Dtos.CustomerRequest request) {
        Customer customer = findCustomer(customerId);
        apply(customer, request);
        return mapper.customer(customerRepository.save(customer));
    }

    @DeleteMapping("/{customerId}")
    public Map<String, String> delete(@PathVariable Long customerId) {
        customerRepository.delete(findCustomer(customerId));
        return Map.of("message", "Customer deleted successfully");
    }

    private Specification<Customer> customerSpec(String search, String status, String state, String source, Boolean emailOptIn) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (search != null && !search.isBlank()) {
                String like = "%" + search.toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("firstName").as(String.class)), like),
                        cb.like(cb.lower(root.get("lastName").as(String.class)), like),
                        cb.like(cb.lower(root.get("email").as(String.class)), like),
                        cb.like(cb.lower(root.get("phone").as(String.class)), like)
                ));
            }
            if (status != null && !status.isBlank()) predicates.add(cb.equal(root.get("status"), status));
            if (state != null && !state.isBlank()) predicates.add(cb.equal(root.get("state"), state));
            if (source != null && !source.isBlank()) predicates.add(cb.equal(root.get("source"), source));
            if (emailOptIn != null) predicates.add(cb.equal(root.get("emailOptIn"), emailOptIn));
            return cb.and(predicates.toArray(Predicate[]::new));
        };
    }

    private void apply(Customer customer, Dtos.CustomerRequest request) {
        if (request.email() != null) customer.setEmail(request.email());
        if (request.firstName() != null) customer.setFirstName(request.firstName());
        if (request.lastName() != null) customer.setLastName(request.lastName());
        if (request.phone() != null) customer.setPhone(request.phone());
        if (request.avatarUrl() != null) customer.setAvatarUrl(request.avatarUrl());
        if (request.addressLine1() != null) customer.setAddressLine1(request.addressLine1());
        if (request.addressLine2() != null) customer.setAddressLine2(request.addressLine2());
        if (request.city() != null) customer.setCity(request.city());
        if (request.state() != null) customer.setState(request.state());
        if (request.country() != null) customer.setCountry(request.country());
        if (request.zipCode() != null) customer.setZipCode(request.zipCode());
        if (request.status() != null) customer.setStatus(request.status());
        if (request.emailOptIn() != null) customer.setEmailOptIn(request.emailOptIn());
        if (request.smsOptIn() != null) customer.setSmsOptIn(request.smsOptIn());
        if (request.source() != null) customer.setSource(request.source());
        if (request.tags() != null) customer.setTags(request.tags());
        if (request.notes() != null) customer.setNotes(request.notes());
    }

    private Customer findCustomer(Long customerId) {
        return customerRepository.findById(customerId).orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Customer not found"));
    }

    private String customerSort(String sortBy) {
        return switch (sortBy) {
            case "total_orders" -> "totalOrders";
            case "created_at" -> "createdAt";
            case "last_order_date" -> "lastOrderDate";
            case "lifetime_value" -> "lifetimeValue";
            default -> "totalSpend";
        };
    }

    private List<Map<String, Object>> topEntries(Map<String, Integer> values) {
        return values.entrySet().stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue(Comparator.reverseOrder()))
                .limit(3)
                .map(entry -> Map.<String, Object>of("name", entry.getKey(), "quantity", entry.getValue()))
                .toList();
    }

    private List<Map<String, Object>> topMoneyEntries(Map<String, Double> values) {
        return values.entrySet().stream()
                .sorted(Map.Entry.<String, Double>comparingByValue(Comparator.reverseOrder()))
                .limit(3)
                .map(entry -> Map.<String, Object>of("name", entry.getKey(), "value", Math.round(entry.getValue() * 100.0) / 100.0))
                .toList();
    }

    private List<Map<String, Object>> monthlySpending(List<CustomerOrder> orders) {
        Map<YearMonth, Double> spending = orders.stream()
                .filter(order -> order.getDate() != null)
                .collect(Collectors.groupingBy(order -> YearMonth.from(order.getDate()), Collectors.summingDouble(order -> order.getTotalAmount() == null ? 0.0 : order.getTotalAmount())));
        return spending.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> Map.<String, Object>of("month", entry.getKey().toString(), "amount", Math.round(entry.getValue() * 100.0) / 100.0))
                .toList();
    }

    private String tier(Double totalSpend) {
        double spend = totalSpend == null ? 0.0 : totalSpend;
        if (spend >= 5000) return "Diamond";
        if (spend >= 2000) return "Platinum";
        if (spend >= 500) return "Gold";
        if (spend >= 100) return "Silver";
        return "Bronze";
    }
}
