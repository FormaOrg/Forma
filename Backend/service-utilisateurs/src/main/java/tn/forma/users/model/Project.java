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
@Table(name = "projects")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "template_id")
    private Long templateId;

    @NotBlank
    @Size(max = 120)
    @Column(nullable = false, length = 120)
    private String name;

    @Size(max = 2000)
    @Column(length = 2000)
    private String description;

    @Size(max = 160)
    @Column(name = "store_title", length = 160)
    private String storeTitle;

    @Size(max = 40)
    @Column(name = "contact_phone", length = 40)
    private String contactPhone;

    @Size(max = 255)
    @Column(name = "store_email", length = 255)
    private String storeEmail;

    @Size(max = 255)
    @Column(name = "default_domain", length = 255)
    private String defaultDomain;

    @Size(max = 500)
    @Column(name = "meta_description", length = 500)
    private String metaDescription;

    @Size(max = 1000)
    @Column(name = "logo_url", length = 1000)
    private String logoUrl;

    @Size(max = 255)
    @Column(name = "logo_public_id", length = 255)
    private String logoPublicId;

    @Size(max = 255)
    @Column(name = "facebook_url", length = 255)
    private String facebookUrl;

    @Size(max = 255)
    @Column(name = "instagram_url", length = 255)
    private String instagramUrl;

    @Size(max = 255)
    @Column(name = "tiktok_url", length = 255)
    private String tiktokUrl;

    @Size(max = 255)
    @Column(name = "whatsapp_number", length = 255)
    private String whatsappNumber;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private ProjectType type;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private CreationMethod creationMethod;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    @Builder.Default
    private ProjectStatus status = ProjectStatus.DRAFT;

    @Column(name = "is_published", nullable = false)
    @Builder.Default
    private boolean published = false;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
