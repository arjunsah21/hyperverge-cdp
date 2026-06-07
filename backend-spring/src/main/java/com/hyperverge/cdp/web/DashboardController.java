package com.hyperverge.cdp.web;

import com.hyperverge.cdp.domain.Customer;
import com.hyperverge.cdp.domain.CustomerOrder;
import com.hyperverge.cdp.domain.OrderItem;
import com.hyperverge.cdp.domain.Product;
import com.hyperverge.cdp.repository.CustomerRepository;
import com.hyperverge.cdp.repository.FlowRepository;
import com.hyperverge.cdp.repository.InsightRepository;
import com.hyperverge.cdp.repository.OrderItemRepository;
import com.hyperverge.cdp.repository.OrderRepository;
import com.hyperverge.cdp.repository.ProductRepository;
import com.hyperverge.cdp.repository.SegmentRepository;
import com.hyperverge.cdp.service.DtoMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardController {
    private final CustomerRepository customerRepository;
    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final OrderItemRepository orderItemRepository;
    private final SegmentRepository segmentRepository;
    private final FlowRepository flowRepository;
    private final InsightRepository insightRepository;
    private final DtoMapper mapper;

    @GetMapping("/stats")
    public Dtos.DashboardStats stats() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime thirtyDaysAgo = now.minusDays(30);
        LocalDateTime sixtyDaysAgo = now.minusDays(60);

        List<Customer> customers = customerRepository.findAll();
        List<CustomerOrder> orders = orderRepository.findAll();
        List<Product> products = productRepository.findAll();

        long totalCustomers = customers.size();
        long customersLastMonth = customers.stream().filter(c -> c.getCreatedAt() != null && c.getCreatedAt().isBefore(thirtyDaysAgo)).count();
        double customersChange = round(((totalCustomers - customersLastMonth) / Math.max((double) customersLastMonth, 1.0)) * 100.0);

        List<CustomerOrder> currentOrders = orders.stream()
                .filter(order -> order.getDate() != null && !order.getDate().isBefore(thirtyDaysAgo))
                .filter(order -> !"Cancelled".equals(order.getStatus()))
                .toList();
        List<CustomerOrder> previousOrders = orders.stream()
                .filter(order -> order.getDate() != null && !order.getDate().isBefore(sixtyDaysAgo) && order.getDate().isBefore(thirtyDaysAgo))
                .filter(order -> !"Cancelled".equals(order.getStatus()))
                .toList();

        double totalRevenue = round(currentOrders.stream().mapToDouble(order -> value(order.getTotalAmount())).sum());
        double previousRevenue = previousOrders.stream().mapToDouble(order -> value(order.getTotalAmount())).sum();
        double revenueChange = previousRevenue > 0 ? round(((totalRevenue - previousRevenue) / previousRevenue) * 100.0) : 0.0;
        long totalOrders = currentOrders.size();
        double averageOrderValue = round(totalRevenue / Math.max(totalOrders, 1));
        double previousAov = previousRevenue / Math.max(previousOrders.size(), 1);
        double aovChange = round(averageOrderValue - previousAov);

        long returningCustomers = customers.stream().filter(customer -> value(customer.getTotalOrders()) > 1).count();
        long newCustomers = totalCustomers - returningCustomers;
        double retention = round((returningCustomers / Math.max((double) totalCustomers, 1.0)) * 100.0);

        Map<String, Integer> productSales = new LinkedHashMap<>();
        for (OrderItem item : orderItemRepository.findAll()) {
            if (item.getOrder().getDate() != null && !item.getOrder().getDate().isBefore(thirtyDaysAgo) && !"Cancelled".equals(item.getOrder().getStatus())) {
                productSales.merge(item.getProduct().getName(), value(item.getQuantity()), Integer::sum);
            }
        }
        Map<String, Object> topProduct = productSales.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(entry -> {
                    Product product = products.stream().filter(p -> p.getName().equals(entry.getKey())).findFirst().orElse(null);
                    Map<String, Object> map = new LinkedHashMap<>();
                    map.put("name", entry.getKey());
                    map.put("units_sold", entry.getValue());
                    map.put("price", product == null ? 0.0 : value(product.getPrice()));
                    map.put("image_url", product == null ? "" : product.getImageUrl());
                    return map;
                })
                .orElse(Map.of("name", "No products", "units_sold", 0, "price", 0.0, "image_url", ""));

        Map<String, Long> stateCounts = customers.stream()
                .filter(customer -> customer.getState() != null)
                .collect(Collectors.groupingBy(Customer::getState, Collectors.counting()));
        long topRegionTotal = stateCounts.values().stream().mapToLong(Long::longValue).sum();
        List<Map<String, Object>> topRegions = stateCounts.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue(Comparator.reverseOrder()))
                .limit(3)
                .map(entry -> Map.<String, Object>of(
                        "name", entry.getKey(),
                        "percentage", Math.round((entry.getValue() / Math.max((double) topRegionTotal, 1.0)) * 100.0)
                ))
                .toList();

        long lowStock = products.stream().filter(product -> "LOW_STOCK".equals(product.getStatus())).count();
        long outOfStock = products.stream().filter(product -> "OUT_OF_STOCK".equals(product.getStatus())).count();
        double inventoryValue = round(products.stream().mapToDouble(product -> value(product.getPrice()) * value(product.getStockLevel())).sum());
        long optedIn = customers.stream().filter(customer -> Boolean.TRUE.equals(customer.getEmailOptIn())).count();

        return new Dtos.DashboardStats(
                totalCustomers,
                customersChange,
                customersLastMonth,
                totalRevenue,
                revenueChange,
                totalOrders,
                averageOrderValue,
                aovChange,
                retention,
                returningCustomers,
                newCustomers,
                topProduct,
                topRegions,
                products.size(),
                lowStock,
                outOfStock,
                inventoryValue,
                segmentRepository.count(),
                flowRepository.findByStatusOrderByCreatedAtDesc("active").size(),
                round((optedIn / Math.max((double) totalCustomers, 1.0)) * 100.0)
        );
    }

    @GetMapping("/insights")
    public Dtos.InsightListResponse insights() {
        return new Dtos.InsightListResponse(insightRepository.findAllByOrderByCreatedAtDesc().stream().map(mapper::insight).toList());
    }

    private double value(Double value) {
        return value == null ? 0.0 : value;
    }

    private int value(Integer value) {
        return value == null ? 0 : value;
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}
