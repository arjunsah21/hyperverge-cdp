package com.hyperverge.cdp.service;

import org.springframework.stereotype.Service;

@Service
public class ProductNeedService {
    public String predictedNeed(Integer stockLevel) {
        int stock = stockLevel == null ? 0 : stockLevel;
        if (stock < 20) {
            return "Order Now";
        }
        if (stock <= 50) {
            return "Restock Soon";
        }
        return "Healthy";
    }

    public String stockStatus(Integer stockLevel) {
        int stock = stockLevel == null ? 0 : stockLevel;
        if (stock <= 0) {
            return "OUT_OF_STOCK";
        }
        if (stock < 50) {
            return "LOW_STOCK";
        }
        return "IN_STOCK";
    }
}
