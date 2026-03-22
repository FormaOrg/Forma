package tn.forma.users.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "users", uniqueConstraints = {
        @UniqueConstraint(columnNames = "email")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank @Size(min = 2, max = 50)
    @Column(nullable = false)
    private String firstName;

    @NotBlank @Size(min = 2, max = 50)
    @Column(nullable = false)
    private String lastName;

    @NotBlank @Email
    @Column(nullable = false, unique = true)
    private String email;

    @NotBlank
    @Column(nullable = false)
    private String password;

    @Size(max = 20)
    private String phone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Role role = Role.STANDARD;

    @Column(nullable = false)
    @Builder.Default
    private boolean isActive = true;

    @Column(nullable = false)
    @Builder.Default
    private boolean emailVerified = false;

    @Column
    private String verificationToken;

    @Column
    private LocalDateTime verificationTokenExpiry;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    public String getFullName() {
        return firstName + " " + lastName;
    }

    public boolean isVerificationTokenValid() {
        return verificationToken != null
                && verificationTokenExpiry != null
                && verificationTokenExpiry.isAfter(LocalDateTime.now());
    }
}