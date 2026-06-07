package com.hyperverge.cdp.web;

import com.hyperverge.cdp.domain.Product;
import com.hyperverge.cdp.repository.ProductRepository;
import com.hyperverge.cdp.service.DtoMapper;
import com.hyperverge.cdp.service.ProductNeedService;
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

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@RestController
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
@Transactional
public class InventoryController {
    private final ProductRepository productRepository;
    private final ProductNeedService productNeedService;
    private final DtoMapper mapper;

    @GetMapping("/stats")
    @Transactional(readOnly = true)
    public Dtos.InventoryStats stats() {
        List<Product> products = productRepository.findAll();
        long lowStock = products.stream().filter(product -> "LOW_STOCK".equals(product.getStatus())).count();
        long outOfStock = products.stream().filter(product -> "OUT_OF_STOCK".equals(product.getStatus())).count();
        double value = products.stream().mapToDouble(product -> safe(product.getPrice()) * safe(product.getStockLevel())).sum();
        return new Dtos.InventoryStats(products.size(), 2.5, lowStock, outOfStock, round(value));
    }

    @GetMapping
    @Transactional(readOnly = true)
    public Dtos.ProductListResponse products(
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "per_page", defaultValue = "10") int perPage,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String category,
            @RequestParam(name = "min_price", required = false) Double minPrice,
            @RequestParam(name = "max_price", required = false) Double maxPrice,
            @RequestParam(name = "predicted_need", required = false) String predictedNeed,
            @RequestParam(name = "sort_by", defaultValue = "created_at") String sortBy,
            @RequestParam(name = "sort_order", defaultValue = "desc") String sortOrder
    ) {
        Sort sort = Sort.by("desc".equalsIgnoreCase(sortOrder) ? Sort.Direction.DESC : Sort.Direction.ASC, productSort(sortBy));
        Page<Product> result = productRepository.findAll(productSpec(search, status, category, minPrice, maxPrice, predictedNeed), PageRequest.of(Math.max(page - 1, 0), perPage, sort));
        return new Dtos.ProductListResponse(result.getContent().stream().map(mapper::product).toList(), result.getTotalElements(), page, perPage);
    }

    @GetMapping("/categories")
    @Transactional(readOnly = true)
    public Map<String, List<String>> categories() {
        return Map.of("categories", productRepository.findDistinctCategories());
    }

    @GetMapping("/{productId}")
    @Transactional(readOnly = true)
    public Dtos.ProductResponse product(@PathVariable Long productId) {
        return mapper.product(findProduct(productId));
    }

    @PostMapping
    public Dtos.ProductResponse create(@Valid @RequestBody Dtos.ProductRequest request) {
        if (productRepository.existsBySku(request.sku())) {
            throw new ResponseStatusException(BAD_REQUEST, "Product with this SKU already exists");
        }
        Product product = new Product();
        apply(product, request);
        return mapper.product(productRepository.save(product));
    }

    @PutMapping("/{productId}")
    public Dtos.ProductResponse update(@PathVariable Long productId, @RequestBody Dtos.ProductRequest request) {
        Product product = findProduct(productId);
        if (request.sku() != null && !request.sku().equals(product.getSku()) && productRepository.existsBySku(request.sku())) {
            throw new ResponseStatusException(BAD_REQUEST, "Product with this SKU already exists");
        }
        apply(product, request);
        return mapper.product(productRepository.save(product));
    }

    @DeleteMapping("/{productId}")
    public Map<String, String> delete(@PathVariable Long productId) {
        productRepository.delete(findProduct(productId));
        return Map.of("message", "Product deleted successfully");
    }

    private Specification<Product> productSpec(String search, String status, String category, Double minPrice, Double maxPrice, String predictedNeed) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (search != null && !search.isBlank()) {
                String like = "%" + search.toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("name").as(String.class)), like),
                        cb.like(cb.lower(root.get("sku").as(String.class)), like)
                ));
            }
            if (status != null && !status.isBlank()) predicates.add(cb.equal(root.get("status"), status));
            if (category != null && !category.isBlank()) predicates.add(cb.equal(root.get("category"), category));
            if (minPrice != null) predicates.add(cb.ge(root.get("price").as(Double.class), minPrice));
            if (maxPrice != null) predicates.add(cb.le(root.get("price").as(Double.class), maxPrice));
            if (predictedNeed != null && !predictedNeed.isBlank()) {
                switch (predictedNeed) {
                    case "Order Now" -> predicates.add(cb.lt(root.get("stockLevel").as(Integer.class), 20));
                    case "Restock Soon" -> predicates.add(cb.between(root.get("stockLevel").as(Integer.class), 20, 50));
                    case "Healthy" -> predicates.add(cb.gt(root.get("stockLevel").as(Integer.class), 50));
                    default -> predicates.add(cb.equal(root.get("predictedNeed"), predictedNeed));
                }
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };
    }

    private void apply(Product product, Dtos.ProductRequest request) {
        if (request.name() != null) product.setName(request.name());
        if (request.sku() != null) product.setSku(request.sku());
        if (request.imageUrl() != null) product.setImageUrl(request.imageUrl());
        if (request.stockLevel() != null) product.setStockLevel(request.stockLevel());
        if (request.price() != null) product.setPrice(request.price());
        if (request.category() != null) product.setCategory(request.category());
        product.setStatus(request.status() == null ? productNeedService.stockStatus(product.getStockLevel()) : request.status());
        product.setPredictedNeed(productNeedService.predictedNeed(product.getStockLevel()));
    }

    private Product findProduct(Long productId) {
        return productRepository.findById(productId).orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Product not found"));
    }

    private String productSort(String sortBy) {
        return switch (sortBy) {
            case "price" -> "price";
            case "stock_level" -> "stockLevel";
            case "name" -> "name";
            default -> "createdAt";
        };
    }

    private double safe(Double value) {
        return value == null ? 0.0 : value;
    }

    private int safe(Integer value) {
        return value == null ? 0 : value;
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}
