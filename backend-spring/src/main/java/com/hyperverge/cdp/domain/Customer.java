package com.hyperverge.cdp.domain;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(
        name = "customers",
        indexes = {
                @Index(name = "ix_customers_email", columnList = "email", unique = true),
                @Index(name = "ix_customers_city", columnList = "city"),
                @Index(name = "ix_customers_state", columnList = "state"),
                @Index(name = "ix_customers_status", columnList = "status")
        }
)
public class Customer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    private String firstName;
    private String lastName;
    private String phone;
    private String avatarUrl;
    private String addressLine1;
    private String addressLine2;
    private String city;
    private String state;
    private String country = "USA";
    private String zipCode;
    private String status = "NEW";
    private Integer totalOrders = 0;
    private Double totalSpend = 0.0;
    private Double lifetimeValue = 0.0;
    private Double averageOrderValue = 0.0;
    private LocalDateTime firstOrderDate;
    private LocalDateTime lastOrderDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Boolean emailOptIn = true;
    private Boolean smsOptIn = false;
    private String source;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private List<String> tags = new ArrayList<>();

    @Column(columnDefinition = "text")
    private String notes;

    @OneToMany(mappedBy = "customer", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CustomerOrder> orders = new ArrayList<>();

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = createdAt == null ? now : createdAt;
        updatedAt = updatedAt == null ? now : updatedAt;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
