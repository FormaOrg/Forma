package tn.forma.users.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "portfolio_inquiries",
        indexes = {
                @Index(name = "idx_portfolio_inquiries_project_created", columnList = "project_id, created_at"),
                @Index(name = "idx_portfolio_inquiries_project_status", columnList = "project_id, status")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PortfolioInquiry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @NotBlank
    @Size(max = 120)
    @Column(nullable = false, length = 120)
    private String name;

    @NotBlank
    @Size(max = 255)
    @Column(nullable = false, length = 255)
    private String email;

    @Size(max = 160)
    @Column(name = "service_label", length = 160)
    private String serviceLabel;

    @Size(max = 120)
    @Column(name = "budget_label", length = 120)
    private String budgetLabel;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private PortfolioInquiryStatus status;

    @Size(max = 120)
    @Column(name = "source_label", length = 120)
    private String sourceLabel;

    @Size(max = 4000)
    @Column(length = 4000)
    private String message;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
