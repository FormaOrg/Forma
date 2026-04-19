package tn.forma.users.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "project_collaborators", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"project_id", "invite_email"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectCollaborator {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "invite_email", nullable = false, length = 255)
    private String inviteEmail;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private CollaboratorRole role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    @Builder.Default
    private CollaboratorStatus status = CollaboratorStatus.PENDING;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime invitedAt;

    @Column
    private LocalDateTime acceptedAt;

    @Column(unique = true, length = 120)
    private String invitationToken;

    @Column
    private LocalDateTime invitationTokenExpiry;

    public boolean isInvitationTokenValid() {
        return invitationToken != null
                && invitationTokenExpiry != null
                && invitationTokenExpiry.isAfter(LocalDateTime.now());
    }
}
