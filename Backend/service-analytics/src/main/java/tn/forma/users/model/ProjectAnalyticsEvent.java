package tn.forma.users.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "project_analytics_events",
        indexes = {
                @Index(name = "idx_project_analytics_events_project_occurred", columnList = "project_id, occurred_at"),
                @Index(name = "idx_project_analytics_events_project_type", columnList = "project_id, event_type")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectAnalyticsEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false, length = 32)
    private ProjectAnalyticsEventType eventType;

    @Size(max = 255)
    @Column(name = "page_path", length = 255)
    private String pagePath;

    @Size(max = 160)
    @Column(name = "page_title", length = 160)
    private String pageTitle;

    @NotBlank
    @Size(max = 160)
    @Column(name = "visitor_key", nullable = false, length = 160)
    private String visitorKey;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "source_type", nullable = false, length = 32)
    private ProjectAnalyticsSourceType sourceType;

    @Size(max = 255)
    @Column(name = "referrer_host", length = 255)
    private String referrerHost;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "device_type", nullable = false, length = 32)
    private ProjectAnalyticsDeviceType deviceType;

    @NotNull
    @Column(name = "occurred_at", nullable = false)
    private LocalDateTime occurredAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
