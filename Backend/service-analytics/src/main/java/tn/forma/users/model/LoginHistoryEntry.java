package tn.forma.users.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "login_history", indexes = {
        @Index(name = "idx_login_history_user_id", columnList = "user_id"),
        @Index(name = "idx_login_history_attempted_email", columnList = "attemptedEmail")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginHistoryEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false, length = 255)
    private String attemptedEmail;

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

    @Column(nullable = false, length = 20)
    private String status;

    @Column(length = 255)
    private String failureReason;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
