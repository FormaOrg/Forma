package tn.forma.users.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import tn.forma.users.dto.ActivitySessionResponse;
import tn.forma.users.dto.AuthResponse;
import tn.forma.users.dto.ConfirmLoginVerificationChangeRequest;
import tn.forma.users.dto.ConfirmEmailChangeRequest;
import tn.forma.users.dto.LoginHistoryEntryResponse;
import tn.forma.users.dto.MessageResponse;
import tn.forma.users.dto.RequestLoginVerificationChangeRequest;
import tn.forma.users.dto.RequestEmailChangeRequest;
import tn.forma.users.dto.SecuritySettingsResponse;
import tn.forma.users.dto.SensitiveActionVerificationResponse;
import tn.forma.users.dto.UpdateRecoveryOptionsRequest;
import tn.forma.users.dto.UpdateProfileRequest;
import tn.forma.users.dto.UpdatePreferencesRequest;
import tn.forma.users.dto.UpdateSecurityQuestionsRequest;
import tn.forma.users.dto.UserDto;
import tn.forma.users.dto.VerifySensitiveActionRequest;
import tn.forma.users.model.Role;
import tn.forma.users.model.User;
import tn.forma.users.repository.UserRepository;
import tn.forma.users.security.UserDetailsServiceImpl;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.Random;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final JwtService jwtService;
    private final UserDetailsServiceImpl userDetailsService;
    private final ActivityService activityService;

    // ── Current user ───────────────────────────────────────

    public UserDto getMe(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return mapToDto(user);
    }

    public SecuritySettingsResponse getSecuritySettings(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return SecuritySettingsResponse.builder()
                .email(user.getEmail())
                .loginVerificationEnabled(user.isLoginVerificationEnabled())
                .securityQuestion1(user.getSecurityQuestion1())
                .securityQuestion2(user.getSecurityQuestion2())
                .recoveryEmail(user.getRecoveryEmail())
                .recoveryPhone(user.getRecoveryPhone())
                .build();
    }

    public String extractSessionIdFromAccessToken(String token) {
        if (!jwtService.isAccessToken(token)) {
            throw new RuntimeException("Invalid access token");
        }
        return jwtService.extractSessionId(token);
    }

    public List<ActivitySessionResponse> getActiveSessions(String email, String currentSessionId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return activityService.getActiveSessions(user, currentSessionId);
    }

    public List<LoginHistoryEntryResponse> getLoginHistory(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return activityService.getLoginHistory(user);
    }

    @Transactional
    public MessageResponse signOutSession(String email, String currentSessionId, String targetSessionId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return activityService.signOutSession(user, targetSessionId, currentSessionId);
    }

    @Transactional
    public MessageResponse signOutOtherSessions(String email, String currentSessionId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return activityService.signOutOtherSessions(user, currentSessionId);
    }

    @Transactional
    public UserDto updateMe(String email, UpdateProfileRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (request.getFirstName() != null) user.setFirstName(request.getFirstName());
        if (request.getLastName()  != null) user.setLastName(request.getLastName());
        if (request.getPhone()     != null) user.setPhone(request.getPhone());
        if (request.getCountry()   != null) user.setCountry(blankToNull(request.getCountry()));
        if (request.getWebsite()   != null) user.setWebsite(blankToNull(request.getWebsite()));
        if (request.getUsername()  != null) {
            String normalizedUsername = blankToNull(request.getUsername());
            if (normalizedUsername != null && !normalizedUsername.equalsIgnoreCase(user.getUsername())
                    && userRepository.existsByUsername(normalizedUsername)) {
                throw new RuntimeException("Username already exists");
            }
            user.setUsername(normalizedUsername);
        }

        userRepository.save(user);
        log.info("Profile updated: {}", email);
        return mapToDto(user);
    }

    @Transactional
    public UserDto updatePreferences(String email, UpdatePreferencesRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String preferredLanguage = blankToNull(request.getPreferredLanguage());
        if (preferredLanguage != null) {
            String normalizedLanguage = preferredLanguage.toLowerCase();
            if (!normalizedLanguage.equals("en") && !normalizedLanguage.equals("fr")) {
                throw new RuntimeException("Preferred language must be en or fr");
            }
            user.setPreferredLanguage(normalizedLanguage);
        }

        userRepository.save(user);
        return mapToDto(user);
    }

    @Transactional
    public void changePassword(String email, String currentPassword, String newPassword) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new RuntimeException("Current password is incorrect");
        }
        if (newPassword.length() < 6) {
            throw new RuntimeException("New password must be at least 6 characters");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        log.info("Password changed: {}", email);
    }

    @Transactional
    public MessageResponse updateSecurityQuestions(String email, UpdateSecurityQuestionsRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        verifySensitiveAction(user, request.getCurrentPassword(), request.getVerificationToken());

        String question1 = requiredTrimmed(request.getQuestion1(), "Question 1 is required");
        String question2 = requiredTrimmed(request.getQuestion2(), "Question 2 is required");
        String answer1 = requiredTrimmed(request.getAnswer1(), "Answer 1 is required");
        String answer2 = requiredTrimmed(request.getAnswer2(), "Answer 2 is required");
        if (question1.equalsIgnoreCase(question2)) {
            throw new RuntimeException("Security questions must be different");
        }

        user.setSecurityQuestion1(question1);
        user.setSecurityQuestion2(question2);
        user.setSecurityAnswer1Hash(passwordEncoder.encode(answer1));
        user.setSecurityAnswer2Hash(passwordEncoder.encode(answer2));
        userRepository.save(user);

        return new MessageResponse("Security questions updated successfully");
    }

    @Transactional
    public MessageResponse updateRecoveryOptions(String email, UpdateRecoveryOptionsRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        verifySensitiveAction(user, request.getCurrentPassword(), request.getVerificationToken());

        String recoveryEmail = blankToNull(request.getRecoveryEmail());
        String recoveryPhone = blankToNull(request.getRecoveryPhone());

        if (recoveryEmail == null && recoveryPhone == null) {
            throw new RuntimeException("At least one recovery option is required");
        }

        user.setRecoveryEmail(recoveryEmail);
        user.setRecoveryPhone(recoveryPhone);
        userRepository.save(user);

        return new MessageResponse("Recovery options updated successfully");
    }

    public SensitiveActionVerificationResponse verifySensitiveSecurityAction(String email, String currentPassword) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        verifyCurrentPassword(user, currentPassword);

        return new SensitiveActionVerificationResponse(
                jwtService.generateSensitiveActionToken(user.getEmail(), user.getId()),
                "Identity confirmed for this session"
        );
    }

    @Transactional
    public MessageResponse requestLoginVerificationChange(String email, RequestLoginVerificationChangeRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.isLoginVerificationEnabled() == request.isEnable()) {
            return new MessageResponse(request.isEnable()
                    ? "2-step verification is already enabled"
                    : "2-step verification is already disabled");
        }

        String code = String.format("%06d", new Random().nextInt(1_000_000));
        user.setPendingLoginVerificationEnabled(request.isEnable());
        user.setLoginVerificationCode(code);
        user.setLoginVerificationCodeExpiry(LocalDateTime.now().plusMinutes(15));
        userRepository.save(user);

        emailService.sendLoginVerificationCode(user.getEmail(), user.getFirstName(), code, request.isEnable());
        return new MessageResponse("Verification code sent to your account email");
    }

    @Transactional
    public MessageResponse confirmLoginVerificationChange(String email, ConfirmLoginVerificationChangeRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getPendingLoginVerificationEnabled() == null || !user.isLoginVerificationCodeValid()) {
            throw new RuntimeException("Verification code has expired");
        }
        if (!request.getCode().equals(user.getLoginVerificationCode())) {
            throw new RuntimeException("Invalid verification code");
        }

        boolean enable = Boolean.TRUE.equals(user.getPendingLoginVerificationEnabled());
        user.setLoginVerificationEnabled(enable);
        user.setPendingLoginVerificationEnabled(null);
        user.setLoginVerificationCode(null);
        user.setLoginVerificationCodeExpiry(null);
        userRepository.save(user);

        return new MessageResponse(enable
                ? "2-step verification enabled successfully"
                : "2-step verification disabled successfully");
    }

    @Transactional
    public MessageResponse disableLoginVerification(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!user.isLoginVerificationEnabled()) {
            return new MessageResponse("2-step verification is already disabled");
        }

        user.setLoginVerificationEnabled(false);
        user.setPendingLoginVerificationEnabled(null);
        user.setLoginVerificationCode(null);
        user.setLoginVerificationCodeExpiry(null);
        userRepository.save(user);

        return new MessageResponse("2-step verification disabled successfully");
    }

    @Transactional
    public MessageResponse requestEmailChange(String email, RequestEmailChangeRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new RuntimeException("Current password is incorrect");
        }

        String normalizedEmail = request.getNewEmail().trim().toLowerCase();
        if (normalizedEmail.equalsIgnoreCase(user.getEmail())) {
            throw new RuntimeException("New email must be different from current email");
        }
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new RuntimeException("Email already exists");
        }

        String code = String.format("%06d", new Random().nextInt(1_000_000));
        user.setPendingEmail(normalizedEmail);
        user.setEmailChangeCode(code);
        user.setEmailChangeCodeExpiry(LocalDateTime.now().plusMinutes(15));
        userRepository.save(user);

        emailService.sendEmailChangeCode(normalizedEmail, user.getFirstName(), code);
        log.info("Email change requested for user {}", email);
        return new MessageResponse("Verification code sent to your new email");
    }

    @Transactional
    public MessageResponse resendEmailChangeCode(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getPendingEmail() == null) {
            throw new RuntimeException("No pending email change found");
        }

        String code = String.format("%06d", new Random().nextInt(1_000_000));
        user.setEmailChangeCode(code);
        user.setEmailChangeCodeExpiry(LocalDateTime.now().plusMinutes(15));
        userRepository.save(user);

        emailService.sendEmailChangeCode(user.getPendingEmail(), user.getFirstName(), code);
        return new MessageResponse("Verification code resent");
    }

    @Transactional
    public AuthResponse confirmEmailChange(String currentEmail, ConfirmEmailChangeRequest request) {
        User user = userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getPendingEmail() == null || !user.isEmailChangeCodeValid()) {
            throw new RuntimeException("Email change code has expired");
        }
        if (!request.getCode().equals(user.getEmailChangeCode())) {
            throw new RuntimeException("Invalid email change code");
        }
        if (userRepository.existsByEmail(user.getPendingEmail())) {
            throw new RuntimeException("Email already exists");
        }

        user.setEmail(user.getPendingEmail());
        user.setPendingEmail(null);
        user.setEmailChangeCode(null);
        user.setEmailChangeCodeExpiry(null);
        user.setEmailVerified(true);
        userRepository.save(user);

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String accessToken = jwtService.generateAccessToken(userDetails, user.getId(), false);
        String refreshToken = jwtService.generateRefreshToken(userDetails, user.getId(), false);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .user(mapToDto(user))
                .build();
    }

    // ── Admin ──────────────────────────────────────────────

    public List<UserDto> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public UserDto getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return mapToDto(user);
    }

    @Transactional
    public UserDto updateRole(Long id, String role) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setRole(Role.valueOf(role));
        userRepository.save(user);
        log.info("Role updated for user {}: {}", id, role);
        return mapToDto(user);
    }

    @Transactional
    public UserDto toggleActive(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setActive(!user.isActive());
        userRepository.save(user);
        log.info("User {} active status: {}", id, user.isActive());
        return mapToDto(user);
    }

    @Transactional
    public void deleteUser(Long id) {
        userRepository.deleteById(id);
        log.info("User deleted: {}", id);
    }

    // ── Helper ─────────────────────────────────────────────

    private UserDto mapToDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .username(user.getUsername())
                .phone(user.getPhone())
                .country(user.getCountry())
                .website(user.getWebsite())
                .preferredLanguage(user.getPreferredLanguage())
                .role(user.getRole().name())
                .isActive(user.isActive())
                .emailVerified(user.isEmailVerified())
                .createdAt(Objects.toString(user.getCreatedAt(), null))
                .updatedAt(Objects.toString(user.getUpdatedAt(), null))
                .build();
    }

    private String blankToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private void verifyCurrentPassword(User user, String currentPassword) {
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new RuntimeException("Current password is incorrect");
        }
    }

    private void verifySensitiveAction(User user, String currentPassword, String verificationToken) {
        String normalizedToken = blankToNull(verificationToken);
        if (normalizedToken != null) {
            if (!jwtService.isSensitiveActionToken(normalizedToken)) {
                throw new RuntimeException("Security verification expired. Please confirm your password again.");
            }

            String email = jwtService.extractEmail(normalizedToken);
            Long userId = jwtService.extractUserId(normalizedToken);
            if (!Objects.equals(user.getEmail(), email) || !Objects.equals(user.getId(), userId)) {
                throw new RuntimeException("Security verification expired. Please confirm your password again.");
            }
            return;
        }

        String normalizedPassword = blankToNull(currentPassword);
        if (normalizedPassword == null) {
            throw new RuntimeException("Current password is required");
        }

        verifyCurrentPassword(user, normalizedPassword);
    }

    private String requiredTrimmed(String value, String message) {
        String trimmed = blankToNull(value);
        if (trimmed == null) {
            throw new RuntimeException(message);
        }
        return trimmed;
    }
}
