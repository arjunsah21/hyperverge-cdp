package com.hyperverge.cdp.service;

import com.hyperverge.cdp.domain.Customer;
import com.hyperverge.cdp.domain.CustomerOrder;
import com.hyperverge.cdp.domain.Flow;
import com.hyperverge.cdp.domain.FlowStep;
import com.hyperverge.cdp.domain.Insight;
import com.hyperverge.cdp.domain.OrderItem;
import com.hyperverge.cdp.domain.Product;
import com.hyperverge.cdp.domain.Segment;
import com.hyperverge.cdp.domain.SegmentRule;
import com.hyperverge.cdp.domain.User;
import com.hyperverge.cdp.repository.CustomerRepository;
import com.hyperverge.cdp.repository.FlowRepository;
import com.hyperverge.cdp.repository.InsightRepository;
import com.hyperverge.cdp.repository.OrderRepository;
import com.hyperverge.cdp.repository.ProductRepository;
import com.hyperverge.cdp.repository.SegmentRepository;
import com.hyperverge.cdp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Random;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {
    private static final String ADMIN_EMAIL = "admin@hyperverge.co";
    private static final String ADMIN_PASSWORD = "admin123";

    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final SegmentRepository segmentRepository;
    private final FlowRepository flowRepository;
    private final InsightRepository insightRepository;
    private final PasswordEncoder passwordEncoder;
    private final ProductNeedService productNeedService;

    @Value("${app.seed.enabled:true}")
    private boolean seedEnabled;

    @Override
    @Transactional
    public void run(String... args) {
        if (!seedEnabled) {
            return;
        }

        createAdmin();
        if (customerRepository.count() > 0) {
            log.info("CDP data already exists; skipping Spring seed data.");
            return;
        }

        log.info("Seeding HyperVerge CDP demo data for Spring backend.");
        List<Product> products = createProducts();
        List<Customer> customers = createCustomers();
        createOrders(customers, products);
        createSegments();
        createFlows();
        createInsights();
        log.info("Spring backend demo data ready. Default login: {} / {}", ADMIN_EMAIL, ADMIN_PASSWORD);
    }

    private void createAdmin() {
        if (userRepository.existsByEmail(ADMIN_EMAIL)) {
            return;
        }
        User user = new User();
        user.setEmail(ADMIN_EMAIL);
        user.setHashedPassword(passwordEncoder.encode(ADMIN_PASSWORD));
        user.setFirstName("Super");
        user.setLastName("Admin");
        user.setRole("SUPER_ADMIN");
        user.setIsActive(true);
        userRepository.save(user);
    }

    private List<Product> createProducts() {
        List<ProductSeed> seeds = List.of(
                new ProductSeed("Hyper Buds Pro", "Audio", 149.99, 500),
                new ProductSeed("HyperPhone Pro 15", "Electronics", 999.99, 200),
                new ProductSeed("HyperBook Air M2", "Electronics", 1299.99, 150),
                new ProductSeed("Noise Buds Pro", "Audio", 79.99, 600),
                new ProductSeed("HyperWatch Elite", "Wearables", 349.99, 300),
                new ProductSeed("HyperPad Pro", "Electronics", 799.99, 180),
                new ProductSeed("Hyper Watch Ultra", "Wearables", 599.99, 250),
                new ProductSeed("SmartSpeaker Max", "Audio", 199.99, 400),
                new ProductSeed("Gaming Mouse X1", "Accessories", 69.99, 800),
                new ProductSeed("Mechanical Keyboard Pro", "Accessories", 129.99, 500),
                new ProductSeed("USB-C Hub Ultra", "Accessories", 49.99, 1000),
                new ProductSeed("Wireless Charger Pad", "Accessories", 39.99, 1200),
                new ProductSeed("4K Webcam Pro", "Electronics", 149.99, 400),
                new ProductSeed("Noise Cancelling Headphones", "Audio", 299.99, 350),
                new ProductSeed("Portable SSD 1TB", "Storage", 129.99, 600),
                new ProductSeed("Smart Display 10", "Electronics", 249.99, 300),
                new ProductSeed("Fitness Tracker Band", "Wearables", 99.99, 700),
                new ProductSeed("Smart Ring", "Wearables", 199.99, 400),
                new ProductSeed("Bluetooth Speaker Mini", "Audio", 49.99, 900),
                new ProductSeed("Laptop Stand Ergonomic", "Accessories", 59.99, 800)
        );

        List<Product> products = new ArrayList<>();
        Random random = new Random(42);
        for (int i = 0; i < seeds.size(); i++) {
            ProductSeed seed = seeds.get(i);
            Product product = new Product();
            product.setName(seed.name());
            product.setCategory(seed.category());
            product.setPrice(seed.price());
            product.setSku("SKU-" + (10000 + i));
            product.setImageUrl("https://api.dicebear.com/7.x/shapes/svg?seed=" + seed.name().replace(" ", ""));
            int stock = Math.max(0, seed.stock() + random.nextInt(140) - 60);
            product.setStockLevel(stock);
            product.setStatus(productNeedService.stockStatus(stock));
            product.setPredictedNeed(productNeedService.predictedNeed(stock));
            products.add(product);
        }
        return productRepository.saveAll(products);
    }

    private List<Customer> createCustomers() {
        List<String> firstNames = List.of("Jane", "Robert", "Cameron", "Arlene", "Wade", "John", "Emma", "Michael", "Sarah", "David", "Olivia", "James", "Sophia", "William", "Isabella", "Benjamin", "Mia", "Lucas", "Charlotte", "Henry");
        List<String> lastNames = List.of("Cooper", "Fox", "Williamson", "McCoy", "Warren", "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson");
        List<String> domains = List.of("gmail.com", "outlook.com", "company.co", "example.com", "yahoo.com", "hotmail.com");
        List<String> states = List.of("Texas", "California", "New York", "Florida", "Illinois", "Pennsylvania", "Ohio", "Georgia", "North Carolina", "Michigan", "New Jersey", "Virginia", "Washington", "Arizona");
        Map<String, List<String>> cities = Map.of(
                "Texas", List.of("Houston", "Austin", "Dallas", "San Antonio"),
                "California", List.of("Los Angeles", "San Francisco", "San Diego", "San Jose"),
                "New York", List.of("New York City", "Buffalo", "Rochester", "Albany"),
                "Florida", List.of("Miami", "Orlando", "Tampa", "Jacksonville"),
                "Illinois", List.of("Chicago", "Aurora", "Naperville", "Joliet")
        );
        List<String> sources = List.of("organic", "paid_search", "social", "referral", "email", "direct");
        List<String> tags = List.of("high-value", "repeat-buyer", "newsletter", "vip", "at-risk", "new", "holiday-shopper", "mobile-user");
        List<String> statuses = List.of("VIP", "ACTIVE", "REGULAR", "NEW", "CHURNED");

        Random random = new Random(99);
        List<Customer> customers = new ArrayList<>();
        for (int i = 0; i < 150; i++) {
            String first = firstNames.get(random.nextInt(firstNames.size()));
            String last = lastNames.get(random.nextInt(lastNames.size()));
            String domain = domains.get(random.nextInt(domains.size()));
            String state = states.get(random.nextInt(states.size()));
            List<String> cityOptions = cities.getOrDefault(state, List.of("Metro City"));

            Customer customer = new Customer();
            customer.setEmail("%s.%s.%d@%s".formatted(first.toLowerCase(), last.toLowerCase(), i, domain));
            customer.setFirstName(first);
            customer.setLastName(last);
            customer.setPhone(random.nextBoolean() ? "+1-%03d-%03d-%04d".formatted(200 + random.nextInt(800), 200 + random.nextInt(800), 1000 + random.nextInt(9000)) : null);
            customer.setAvatarUrl("https://api.dicebear.com/7.x/avataaars/svg?seed=" + i);
            customer.setAddressLine1((100 + random.nextInt(9000)) + " Main St");
            customer.setCity(cityOptions.get(random.nextInt(cityOptions.size())));
            customer.setState(state);
            customer.setCountry("USA");
            customer.setZipCode(String.valueOf(10000 + random.nextInt(89999)));
            customer.setStatus(statuses.get(random.nextInt(statuses.size())));
            customer.setEmailOptIn(random.nextDouble() > 0.15);
            customer.setSmsOptIn(random.nextDouble() > 0.70);
            customer.setSource(sources.get(random.nextInt(sources.size())));
            customer.setTags(List.of(tags.get(random.nextInt(tags.size()))));
            customer.setCreatedAt(LocalDateTime.now().minusDays(1 + random.nextInt(730)));
            customers.add(customer);
        }
        return customerRepository.saveAll(customers);
    }

    private void createOrders(List<Customer> customers, List<Product> products) {
        Random random = new Random(123);
        List<String> statuses = List.of("Pending", "Shipped", "Delivered", "Cancelled");
        for (int i = 0; i < 1200; i++) {
            Customer customer = customers.get(random.nextInt(customers.size()));
            CustomerOrder order = new CustomerOrder();
            order.setOrderId("HV-" + (1000 + i));
            order.setCustomer(customer);
            order.setDate(LocalDateTime.now().minusDays(random.nextInt(365)));
            order.setStatus(statuses.get(random.nextInt(statuses.size())));
            order.setShippingAddress("%s, %s, %s %s".formatted(customer.getAddressLine1(), customer.getCity(), customer.getState(), customer.getZipCode()));

            int itemCount = 1 + random.nextInt(4);
            double total = 0.0;
            for (int j = 0; j < itemCount; j++) {
                Product product = products.get(random.nextInt(products.size()));
                int quantity = 1 + random.nextInt(3);
                OrderItem item = new OrderItem();
                item.setOrder(order);
                item.setProduct(product);
                item.setQuantity(quantity);
                item.setPriceAtPurchase(product.getPrice());
                order.getItems().add(item);
                total += product.getPrice() * quantity;
                product.setStockLevel(Math.max(0, product.getStockLevel() - quantity));
                product.setStatus(productNeedService.stockStatus(product.getStockLevel()));
                product.setPredictedNeed(productNeedService.predictedNeed(product.getStockLevel()));
            }

            order.setTotalAmount(Math.round(total * 100.0) / 100.0);
            orderRepository.save(order);

            if (!"Cancelled".equals(order.getStatus())) {
                customer.setTotalOrders(customer.getTotalOrders() + 1);
                customer.setTotalSpend(customer.getTotalSpend() + order.getTotalAmount());
                customer.setLifetimeValue(customer.getTotalSpend() * 1.2);
                customer.setAverageOrderValue(customer.getTotalSpend() / Math.max(customer.getTotalOrders(), 1));
                if (customer.getFirstOrderDate() == null || order.getDate().isBefore(customer.getFirstOrderDate())) {
                    customer.setFirstOrderDate(order.getDate());
                }
                if (customer.getLastOrderDate() == null || order.getDate().isAfter(customer.getLastOrderDate())) {
                    customer.setLastOrderDate(order.getDate());
                }
                customer.setStatus(statusFor(customer));
            }
        }
        customerRepository.saveAll(customers);
        productRepository.saveAll(products);
    }

    private void createSegments() {
        Segment highValue = segment("High-Value Customers", "Customers with strong lifetime spend", "AND",
                rule("total_spend", "greater_than", "5000"));
        Segment texas = segment("Texas Customers", "Customers located in Texas", "AND",
                rule("state", "equals", "Texas"));
        Segment gmail = segment("Gmail Users", "Customers using Gmail addresses", "AND",
                rule("email", "contains", "gmail.com"));
        Segment recent = segment("Recent Buyers", "Customers who ordered recently", "AND",
                rule("last_order_date", "within_days", "30"));
        Segment vip = segment("VIP Customers", "Manually or automatically VIP tagged customers", "AND",
                rule("status", "equals", "VIP"));
        segmentRepository.saveAll(List.of(highValue, texas, gmail, recent, vip));
    }

    private void createFlows() {
        List<Segment> segments = segmentRepository.findAll();
        Segment firstSegment = segments.isEmpty() ? null : segments.get(0);
        Flow welcome = flow("Welcome Series", "A three-part onboarding sequence", firstSegment, "active");
        addStep(welcome, 1, "Welcome to HyperVerge!", "Hi {{customer.first_name}}, welcome to HyperVerge.", 0, 0);
        addStep(welcome, 2, "Your getting started guide", "Here are our most popular products and tips.", 2, 0);
        addStep(welcome, 3, "A first purchase discount", "Use code WELCOME10 on your next order.", 5, 0);

        Flow abandoned = flow("Abandoned Cart Recovery", "Bring shoppers back to abandoned carts", firstSegment, "draft");
        addStep(abandoned, 1, "You left something behind", "Your cart is waiting for you.", 0, 4);
        addStep(abandoned, 2, "Still thinking it over?", "Here is a small incentive to complete your order.", 1, 0);

        Flow reengage = flow("Re-engagement", "Win back inactive customers", firstSegment, "paused");
        addStep(reengage, 1, "We miss you", "Come back and see what is new.", 0, 0);
        addStep(reengage, 2, "A special offer for you", "Here is an exclusive offer to restart your journey.", 3, 0);

        flowRepository.saveAll(List.of(welcome, abandoned, reengage));
    }

    private void createInsights() {
        List<InsightSeed> seeds = List.of(
                new InsightSeed("Positive Sales Spike", "Hyper Buds Pro sales are up 40% in North America.", "positive", "trending-up", "2m ago"),
                new InsightSeed("Inventory Warning", "Stock for 'Hyper Watch Ultra' is critically low.", "warning", "alert-triangle", "45m ago"),
                new InsightSeed("New Customer Milestone", "You've reached 150 seeded customers.", "positive", "users", "1h ago"),
                new InsightSeed("Segment Alert", "Your High-Value Customers segment is growing.", "positive", "users-plus", "2h ago"),
                new InsightSeed("Flow Performance", "Welcome Series flow has a healthy open rate.", "positive", "mail", "3h ago")
        );
        insightRepository.saveAll(seeds.stream().map(seed -> {
            Insight insight = new Insight();
            insight.setTitle(seed.title());
            insight.setDescription(seed.description());
            insight.setType(seed.type());
            insight.setIcon(seed.icon());
            insight.setTimeAgo(seed.timeAgo());
            return insight;
        }).toList());
    }

    private Segment segment(String name, String description, String logic, SegmentRule... rules) {
        Segment segment = new Segment();
        segment.setName(name);
        segment.setDescription(description);
        segment.setLogic(logic);
        for (SegmentRule rule : rules) {
            rule.setSegment(segment);
            segment.getRules().add(rule);
        }
        return segment;
    }

    private SegmentRule rule(String field, String operator, String value) {
        SegmentRule rule = new SegmentRule();
        rule.setField(field);
        rule.setOperator(operator);
        rule.setValue(value);
        return rule;
    }

    private Flow flow(String name, String description, Segment segment, String status) {
        Flow flow = new Flow();
        flow.setName(name);
        flow.setDescription(description);
        flow.setTriggerType(segment == null ? "manual" : "segment");
        flow.setSegment(segment);
        flow.setStatus(status);
        return flow;
    }

    private void addStep(Flow flow, int order, String subject, String content, int delayDays, int delayHours) {
        FlowStep step = new FlowStep();
        step.setFlow(flow);
        step.setOrder(order);
        step.setStepType("email");
        step.setSubject(subject);
        step.setContent(content);
        step.setDelayDays(delayDays);
        step.setDelayHours(delayHours);
        flow.getSteps().add(step);
    }

    private String statusFor(Customer customer) {
        if (customer.getTotalSpend() >= 5000) {
            return "VIP";
        }
        if (customer.getLastOrderDate() != null && customer.getLastOrderDate().isAfter(LocalDateTime.now().minusDays(60)) && customer.getTotalOrders() >= 3) {
            return "ACTIVE";
        }
        if (customer.getLastOrderDate() != null && customer.getLastOrderDate().isBefore(LocalDateTime.now().minusDays(120))) {
            return "CHURNED";
        }
        if (customer.getTotalOrders() <= 1) {
            return "NEW";
        }
        return "REGULAR";
    }

    private record ProductSeed(String name, String category, double price, int stock) {
    }

    private record InsightSeed(String title, String description, String type, String icon, String timeAgo) {
    }
}
