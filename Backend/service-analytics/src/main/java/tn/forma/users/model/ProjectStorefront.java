package tn.forma.users.model;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

@Entity
@Table(name = "project_storefronts", indexes = {
        @Index(name = "idx_project_storefronts_project_id", columnList = "project_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectStorefront {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false, unique = true)
    private Project project;

    @Size(max = 160)
    @Column(name = "store_name", length = 160)
    private String storeName;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "store_status", nullable = false, length = 20)
    @Builder.Default
    private StorefrontStatus storeStatus = StorefrontStatus.DRAFT;

    @Size(max = 80)
    @Column(name = "theme_key", length = 80)
    private String themeKey;

    @NotBlank
    @Size(max = 80)
    @Column(name = "active_page_key", nullable = false, length = 80)
    @Builder.Default
    private String activePageKey = "home";

    @NotNull
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "draft_homepage_json", nullable = false, columnDefinition = "jsonb")
    private JsonNode draftHomepageJson;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "published_homepage_json", columnDefinition = "jsonb")
    private JsonNode publishedHomepageJson;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "editor_session_json", columnDefinition = "jsonb")
    private JsonNode editorSessionJson;

    @Column(name = "published_at")
    private LocalDateTime publishedAt;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
