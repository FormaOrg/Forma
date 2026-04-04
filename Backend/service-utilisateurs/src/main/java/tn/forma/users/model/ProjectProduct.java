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

@Entity
@Table(name = "project_products", indexes = {
        @Index(name = "idx_project_products_project_id", columnList = "project_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectProduct {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @NotBlank
    @Size(max = 140)
    @Column(nullable = false, length = 140)
    private String name;

    @Size(max = 80)
    @Column(length = 80)
    private String sku;

    @Size(max = 120)
    @Column(length = 120)
    private String category;

    @Size(max = 2000)
    @Column(length = 2000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(length = 24)
    @Builder.Default
    private ProjectProductType productType = ProjectProductType.PHYSICAL;

    @Enumerated(EnumType.STRING)
    @Column(length = 24)
    @Builder.Default
    private ProjectProductStatus status = ProjectProductStatus.DRAFT;

    @NotNull
    @DecimalMin("0.00")
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    @DecimalMin("0.00")
    @Column(precision = 12, scale = 2)
    private BigDecimal compareAtPrice;

    @Column
    @Builder.Default
    private Integer inventoryQuantity = 0;

    @Size(max = 1024)
    @Column(length = 1024)
    private String imageUrl;

    @Size(max = 500)
    @Column(length = 500)
    private String tagsCsv;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
