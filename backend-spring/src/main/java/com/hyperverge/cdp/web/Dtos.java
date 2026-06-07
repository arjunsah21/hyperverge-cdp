package com.hyperverge.cdp.web;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public final class Dtos {
    private Dtos() {
    }

    public record TokenResponse(String accessToken, String tokenType) {
    }

    public record UserCreate(
            @Email @NotBlank String email,
            @NotBlank String password,
            String firstName,
            String lastName
    ) {
    }

    public record UserUpdate(String firstName, String lastName, @Email String email, String role) {
    }

    public record UserAdminUpdate(String firstName, String lastName, @Email String email, String role, Boolean isActive) {
    }

    public record UserResponse(
            Long id,
            String email,
            String firstName,
            String lastName,
            String avatarUrl,
            String role,
            Boolean isActive,
            LocalDateTime createdAt,
            LocalDateTime updatedAt
    ) {
    }

    public record VerifyEmail(@Email @NotBlank String email, @NotBlank String code) {
    }

    public record ForgotPassword(@Email @NotBlank String email) {
    }

    public record ResetPassword(@Email @NotBlank String email, @NotBlank String code, @NotBlank String newPassword) {
    }

    public record CustomerRequest(
            @Email @NotBlank String email,
            String firstName,
            String lastName,
            String phone,
            String avatarUrl,
            String addressLine1,
            String addressLine2,
            String city,
            String state,
            String country,
            String zipCode,
            String status,
            Boolean emailOptIn,
            Boolean smsOptIn,
            String source,
            List<String> tags,
            String notes
    ) {
    }

    public record CustomerResponse(
            Long id,
            String email,
            String firstName,
            String lastName,
            String name,
            String phone,
            String avatarUrl,
            String city,
            String state,
            String country,
            String zipCode,
            String status,
            Integer totalOrders,
            Double totalSpend,
            Double lifetimeValue,
            Double averageOrderValue,
            LocalDateTime firstOrderDate,
            LocalDateTime lastOrderDate,
            Boolean emailOptIn,
            Boolean smsOptIn,
            String source,
            List<String> tags,
            LocalDateTime createdAt,
            LocalDateTime updatedAt
    ) {
    }

    public record CustomerListResponse(List<CustomerResponse> customers, long total, int page, int perPage) {
    }

    public record CustomerDetailsResponse(CustomerResponse customer, List<Map<String, Object>> orders, Map<String, Object> insights) {
    }

    public record OrderResponse(
            Long id,
            String orderId,
            Long customerId,
            String customerName,
            String customerInitials,
            LocalDateTime date,
            String status,
            Double totalAmount
    ) {
    }

    public record OrderListResponse(List<OrderResponse> orders, long total, int page, int perPage) {
    }

    public record ProductRequest(
            @NotBlank String name,
            @NotBlank String sku,
            String imageUrl,
            @NotNull Integer stockLevel,
            @NotNull Double price,
            String status,
            String predictedNeed,
            String category
    ) {
    }

    public record ProductResponse(
            Long id,
            String name,
            String sku,
            String imageUrl,
            Integer stockLevel,
            Double price,
            String status,
            String predictedNeed,
            String category,
            LocalDateTime createdAt
    ) {
    }

    public record ProductListResponse(List<ProductResponse> products, long total, int page, int perPage) {
    }

    public record InventoryStats(
            long totalSkus,
            double skusChange,
            long lowStockAlerts,
            long outOfStock,
            double inventoryValue
    ) {
    }

    public record SegmentRuleRequest(@NotBlank String field, @NotBlank String operator, @NotBlank String value) {
    }

    public record SegmentRuleResponse(Long id, Long segmentId, String field, String operator, String value, LocalDateTime createdAt) {
    }

    public record SegmentRequest(
            @NotBlank String name,
            String description,
            String logic,
            Boolean isDynamic,
            @Valid List<SegmentRuleRequest> rules
    ) {
    }

    public record SegmentResponse(
            Long id,
            String name,
            String description,
            String logic,
            Boolean isDynamic,
            long customerCount,
            List<SegmentRuleResponse> rules,
            LocalDateTime createdAt,
            LocalDateTime updatedAt
    ) {
    }

    public record SegmentListResponse(List<SegmentResponse> segments, long total) {
    }

    public record SegmentCustomersResponse(
            SegmentResponse segment,
            List<CustomerResponse> customers,
            long total,
            int page,
            int perPage
    ) {
    }

    public record FlowStepRequest(
            @NotNull Integer order,
            String stepType,
            String subject,
            String content,
            Integer delayDays,
            Integer delayHours
    ) {
    }

    public record FlowStepResponse(
            Long id,
            Long flowId,
            Integer order,
            String stepType,
            String subject,
            String content,
            Integer delayDays,
            Integer delayHours,
            Integer sentCount,
            Integer openCount,
            Integer clickCount,
            LocalDateTime createdAt
    ) {
    }

    public record FlowRequest(
            @NotBlank String name,
            String description,
            String triggerType,
            Long segmentId,
            String status,
            @Valid List<FlowStepRequest> steps
    ) {
    }

    public record FlowUpdateRequest(String name, String description, String triggerType, Long segmentId, String status) {
    }

    public record FlowResponse(
            Long id,
            String name,
            String description,
            String triggerType,
            Long segmentId,
            String status,
            Integer totalSent,
            Integer totalOpened,
            Integer totalClicked,
            List<FlowStepResponse> steps,
            LocalDateTime createdAt,
            LocalDateTime updatedAt
    ) {
    }

    public record FlowListResponse(List<FlowResponse> flows, long total) {
    }

    public record AiPromptRequest(@NotBlank String prompt) {
    }

    public record DashboardStats(
            long totalCustomers,
            double customersChange,
            long customersLastMonth,
            double totalRevenue,
            double revenueChange,
            long totalOrders,
            double averageOrderValue,
            double aovChange,
            double customerRetention,
            long returningCustomers,
            long newCustomers,
            Map<String, Object> topProduct,
            List<Map<String, Object>> topRegions,
            long totalSkus,
            long lowStockAlerts,
            long outOfStock,
            double inventoryValue,
            long totalSegments,
            long activeFlows,
            double emailOptInRate
    ) {
    }

    public record InsightResponse(Long id, String title, String description, String type, String icon, String timeAgo) {
    }

    public record InsightListResponse(List<InsightResponse> insights) {
    }
}
