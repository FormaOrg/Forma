package tn.forma.users.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_sessions", indexes = {
        @Index(name = "idx_user_sessions_user_id", columnList = "user_id"),
        @Index(name = "idx_user_sessions_session_id", columnList = "sessionId", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, unique = true, length = 100)
    private String sessionId;

    @Column(nullable = false, length = 50)
    private String deviceType;

    @Column(nullable = false, length = 255)
    private String deviceName;

    @Column(nullable = false, length = 100)
    private String browser;

    @Column(nullable = false, length = 100)
    private String operatingSystem;

    @Column(nullable = false, length = 255)
    private String location;

    @Column(nullable = false, length = 100)
    private String ipAddress;

    @Column(nullable = false)
    @Builder.Default
    private boolean rememberMe = false;

    @Column(nullable = false)
    @Builder.Default
    private boolean revoked = false;

    @Column
    private LocalDateTime revokedAt;

    @Column(nullable = false)
    private LocalDateTime lastActiveAt;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
