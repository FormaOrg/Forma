package tn.forma.users.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "project_orders", indexes = {
        @Index(name = "idx_project_orders_project_id", columnList = "project_id"),
        @Index(name = "idx_project_orders_placed_at", columnList = "placed_at"),
        @Index(name = "idx_project_orders_order_number", columnList = "order_number")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private ProjectCustomer customer;

    @NotBlank
    @Size(max = 60)
    @Column(name = "order_number", nullable = false, length = 60)
    private String orderNumber;

    @NotNull
    @Column(name = "placed_at", nullable = false)
    private LocalDateTime placedAt;

    @Column(name = "scheduled_for")
    private LocalDateTime scheduledFor;

    @Column(name = "delivered_at")
    private LocalDateTime deliveredAt;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", nullable = false, length = 32)
    private OrderPaymentStatus paymentStatus;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "fulfillment_status", nullable = false, length = 32)
    private OrderFulfillmentStatus fulfillmentStatus;

    @NotNull
    @DecimalMin("0.00")
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal subtotal;

    @NotNull
    @DecimalMin("0.00")
    @Column(name = "delivery_fee", nullable = false, precision = 12, scale = 2)
    private BigDecimal deliveryFee;

    @NotNull
    @DecimalMin("0.00")
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal total;

    @Size(max = 255)
    @Column(name = "delivery_address", length = 255)
    private String deliveryAddress;

    @Size(max = 1000)
    @Column(length = 1000)
    private String notes;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ProjectOrderItem> items = new ArrayList<>();

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
