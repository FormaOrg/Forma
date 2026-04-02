package tn.forma.users.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "users", uniqueConstraints = {
        @UniqueConstraint(columnNames = "email"),
        @UniqueConstraint(columnNames = "username")
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

    @Size(min = 3, max = 50)
    @Column(unique = true)
    private String username;

    @NotBlank
    @Column(nullable = false)
    private String password;

    @Size(max = 20)
    private String phone;

    @Size(max = 100)
    private String country;

    @Size(max = 255)
    private String website;

    @Size(max = 1000)
    private String avatarUrl;

    @Size(max = 255)
    private String avatarPublicId;

    @Size(max = 255)
    @Column(unique = true)
    private String googleId;

    @Email
    @Size(max = 255)
    private String googleEmail;

    @Column(nullable = false, length = 8)
    @Builder.Default
    private String preferredLanguage = "en";

    @Column(nullable = false, length = 16)
    @Builder.Default
    private String preferredTheme = "light";

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

    @Column
    private String pendingEmail;

    @Column(length = 6)
    private String emailChangeCode;

    @Column
    private LocalDateTime emailChangeCodeExpiry;

    @Column
    private LocalDateTime lastLoginAt;

    @Column(nullable = false)
    @Builder.Default
    private boolean loginVerificationEnabled = false;

    @Column
    private Boolean pendingLoginVerificationEnabled;

    @Column(length = 6)
    private String loginVerificationCode;

    @Column
    private LocalDateTime loginVerificationCodeExpiry;

    @Size(max = 255)
    private String securityQuestion1;

    @Size(max = 255)
    private String securityQuestion2;

    @Size(max = 255)
    private String securityAnswer1Hash;

    @Size(max = 255)
    private String securityAnswer2Hash;

    @Email
    @Size(max = 255)
    private String recoveryEmail;

    @Size(max = 20)
    private String recoveryPhone;

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

    public boolean isEmailChangeCodeValid() {
        return emailChangeCode != null
                && emailChangeCodeExpiry != null
                && emailChangeCodeExpiry.isAfter(LocalDateTime.now());
    }

    public boolean isLoginVerificationCodeValid() {
        return loginVerificationCode != null
                && loginVerificationCodeExpiry != null
                && loginVerificationCodeExpiry.isAfter(LocalDateTime.now());
    }
}
