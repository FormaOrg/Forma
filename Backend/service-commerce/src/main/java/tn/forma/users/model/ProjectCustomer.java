package tn.forma.users.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "project_customers", indexes = {
        @Index(name = "idx_project_customers_project_id", columnList = "project_id"),
        @Index(name = "idx_project_customers_email", columnList = "email")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectCustomer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @NotBlank
    @Size(max = 120)
    @Column(name = "first_name", nullable = false, length = 120)
    private String firstName;

    @NotBlank
    @Size(max = 120)
    @Column(name = "last_name", nullable = false, length = 120)
    private String lastName;

    @Email
    @Size(max = 255)
    @Column(length = 255)
    private String email;

    @Size(max = 40)
    @Column(length = 40)
    private String phone;

    @Size(max = 255)
    @Column(length = 255)
    private String address;

    @Size(max = 120)
    @Column(name = "zone_label", length = 120)
    private String zoneLabel;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
