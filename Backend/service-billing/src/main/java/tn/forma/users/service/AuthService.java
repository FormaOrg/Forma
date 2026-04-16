package tn.forma.users.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.forma.users.dto.*;
import tn.forma.users.model.Role;
import tn.forma.users.model.User;
import tn.forma.users.repository.UserRepository;
import tn.forma.users.security.UserDetailsServiceImpl;

import java.time.LocalDateTime;
import java.util.Objects;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsServiceImpl userDetailsService;
    private final EmailService emailService;
    private final ActivityService activityService;
    private final GoogleIdentityService googleIdentityService;
    private final GoogleLinkOauthService googleLinkOauthService;

    // ── Register ───────────────────────────────────────────

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        String verificationToken = UUID.randomUUID().toString();

        User user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .role(Role.STANDARD)
                .isActive(true)
                .emailVerified(false)
                .verificationToken(verificationToken)
                .verificationTokenExpiry(LocalDateTime.now().plusHours(24))
                .build();

        userRepository.save(user);
        log.info("New user registered: {}", user.getEmail());

        try {
            emailService.sendVerificationEmail(
                    user.getEmail(),
                    user.getFirstName(),
                    verificationToken
            );
        } catch (Exception e) {
            log.warn("Failed to send verification email to {}: {}", user.getEmail(), e.getMessage());
        }

        // Don't issue tokens at registration — user must verify email first
        UserDto userDto = mapToUserDto(user);
        return AuthResponse.builder()
                .accessToken(null)
                .refreshToken(null)
                .user(userDto)
                .build();
    }

    // ── Login ──────────────────────────────────────────────

    @Transactional
    public AuthResponse login(LoginRequest request) {
        User existingUser = userRepository.findByEmail(request.getEmail()).orElse(null);

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail(),
                            request.getPassword()
                    )
            );
        } catch (AuthenticationException ex) {
            activityService.recordFailedLogin(
                    request.getEmail(),
                    ex instanceof BadCredentialsException ? "Incorrect password" : "Authentication failed",
                    existingUser
            );
            throw ex;
        }

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!user.isEmailVerified()) {
            activityService.recordFailedLogin(request.getEmail(), "Email not verified", user);
            throw new RuntimeException("Please verify your email before logging in");
        }

        if (!user.isActive()) {
            activityService.recordFailedLogin(request.getEmail(), "Account disabled", user);
            throw new RuntimeException("Account is disabled");
        }

        if (user.isLoginVerificationEnabled()) {
            issueLoginVerificationChallenge(user);

            return AuthResponse.builder()
                    .user(mapToUserDto(user))
                    .requiresLoginVerification(true)
                    .loginVerificationToken(
                            jwtService.generateLoginVerificationToken(
                                    user.getEmail(),
                                    user.getId(),
                                    request.isRememberMe()
                            )
                    )
                    .message("We sent a 6-digit verification code to your email.")
                    .build();
        }

        return createAuthenticatedResponse(user, request.isRememberMe());
    }

    @Transactional
    public AuthResponse loginWithGoogle(GoogleAuthRequest request) {
        GoogleIdToken.Payload payload = googleIdentityService.verifyIdToken(request.getIdToken());
        return loginWithGooglePayload(payload, request.isRememberMe());
    }

    @Transactional
    public AuthResponse loginWithGoogleCode(GoogleAuthCodeRequest request) {
        GoogleIdToken.Payload payload = googleLinkOauthService.exchangeCodeForPayload(
                request.getCode(),
                request.getRedirectUri()
        );
        return loginWithGooglePayload(payload, request.isRememberMe());
    }

    private AuthResponse loginWithGooglePayload(GoogleIdToken.Payload payload, boolean rememberMe) {
        String email = payload.getEmail();
        String googleId = payload.getSubject();

        if (email == null || email.isBlank()) {
            throw new RuntimeException("Google account did not provide an email address");
        }

        if (!Boolean.TRUE.equals(payload.getEmailVerified())) {
            throw new RuntimeException("Google account email is not verified");
        }

        User user = userRepository.findByGoogleId(googleId)
                .orElseGet(() -> userRepository.findByEmail(email)
                .map(existingUser -> syncGoogleUser(existingUser, payload))
                .orElseGet(() -> createGoogleUser(payload)));

        if (!user.isActive()) {
            throw new RuntimeException("Account is disabled");
        }

        if (user.isLoginVerificationEnabled()) {
            issueLoginVerificationChallenge(user);

            return AuthResponse.builder()
                    .user(mapToUserDto(user))
                    .requiresLoginVerification(true)
                    .loginVerificationToken(
                            jwtService.generateLoginVerificationToken(
                                    user.getEmail(),
                                    user.getId(),
                                    rememberMe
                            )
                    )
                    .message("We sent a 6-digit verification code to your email.")
                    .build();
        }

        return createAuthenticatedResponse(user, rememberMe);
    }

    @Transactional
    public AuthResponse verifyLogin(LoginVerificationRequest request) {
        User user = getUserFromLoginVerificationToken(request.getToken());

        if (!user.isLoginVerificationEnabled()) {
            throw new RuntimeException("Login verification is not enabled for this account");
        }

        if (!user.isLoginVerificationCodeValid()) {
            throw new RuntimeException("Login verification code has expired");
        }

        if (!request.getCode().equals(user.getLoginVerificationCode())) {
            throw new RuntimeException("Invalid login verification code");
        }

        clearLoginVerificationCode(user);
        return createAuthenticatedResponse(user, jwtService.extractRememberMe(request.getToken()));
    }

    @Transactional
    public MessageResponse resendLoginVerification(String verificationToken) {
        User user = getUserFromLoginVerificationToken(verificationToken);

        if (!user.isLoginVerificationEnabled()) {
            throw new RuntimeException("Login verification is not enabled for this account");
        }

        issueLoginVerificationChallenge(user);
        return new MessageResponse("A new login verification code has been sent to your email.");
    }

    // ── Refresh token ──────────────────────────────────────

    public AuthResponse refresh(String refreshToken) {
        if (!jwtService.isRefreshToken(refreshToken)) {
            throw new RuntimeException("Invalid refresh token");
        }

        String email = jwtService.extractEmail(refreshToken);
        String sessionId = jwtService.extractSessionId(refreshToken);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        UserDetails userDetails = userDetailsService.loadUserByUsername(email);

        if (!activityService.isSessionActive(sessionId)) {
            throw new RuntimeException("Session has been signed out");
        }

        if (!jwtService.isTokenValid(refreshToken, userDetails)) {
            throw new RuntimeException("Refresh token expired");
        }

        boolean rememberMe = jwtService.extractRememberMe(refreshToken);
        String newAccessToken  = jwtService.generateAccessToken(userDetails, user.getId(), rememberMe, sessionId);
        String newRefreshToken = jwtService.generateRefreshToken(userDetails, user.getId(), rememberMe, sessionId);

        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .user(mapToUserDto(user))
                .build();
    }

    // ── Email verification ─────────────────────────────────

    @Transactional
    public MessageResponse verifyEmail(String token) {
        User user = userRepository.findByVerificationToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid verification token"));

        if (user.isEmailVerified()) {
            return new MessageResponse("Email is already verified");
        }

        if (!user.isVerificationTokenValid()) {
            throw new RuntimeException("Verification token has expired. Please request a new one.");
        }

        user.setEmailVerified(true);
        user.setVerificationToken(null);
        user.setVerificationTokenExpiry(null);
        userRepository.save(user);

        log.info("Email verified for user: {}", user.getEmail());
        return new MessageResponse("Email verified successfully!");
    }

    @Transactional
    public MessageResponse resendVerification(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.isEmailVerified()) {
            throw new RuntimeException("Email is already verified");
        }

        String newToken = UUID.randomUUID().toString();
        user.setVerificationToken(newToken);
        user.setVerificationTokenExpiry(LocalDateTime.now().plusHours(24));
        userRepository.save(user);

        emailService.sendVerificationEmail(user.getEmail(), user.getFirstName(), newToken);
        return new MessageResponse("Verification email sent. Please check your inbox.");
    }

    // ── Password reset ─────────────────────────────────────

    @Transactional
    public MessageResponse forgotPassword(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String resetToken = UUID.randomUUID().toString();
        user.setVerificationToken(resetToken);
        user.setVerificationTokenExpiry(LocalDateTime.now().plusHours(1));
        userRepository.save(user);

        emailService.sendPasswordResetEmail(user.getEmail(), user.getFirstName(), resetToken);
        return new MessageResponse("Password reset email sent.");
    }

    @Transactional
    public MessageResponse resetPassword(String token, String newPassword) {
        User user = userRepository.findByVerificationToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid or expired reset token"));

        if (!user.isVerificationTokenValid()) {
            throw new RuntimeException("Reset token has expired. Please request a new one.");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setVerificationToken(null);
        user.setVerificationTokenExpiry(null);
        userRepository.save(user);

        log.info("Password reset for user: {}", user.getEmail());
        return new MessageResponse("Password reset successfully.");
    }

    public String getGoogleClientId() {
        return googleIdentityService.getClientId();
    }

    public GoogleLinkConfigResponse getGoogleLinkConfig() {
        return googleLinkOauthService.getConfig();
    }

    // ── Private helpers ────────────────────────────────────

    private UserDto mapToUserDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .username(user.getUsername())
                .phone(user.getPhone())
                .country(user.getCountry())
                .website(user.getWebsite())
                .avatarUrl(user.getAvatarUrl())
                .googleConnected(user.getGoogleId() != null && !user.getGoogleId().isBlank())
                .googleEmail(user.getGoogleEmail())
                .preferredLanguage(user.getPreferredLanguage())
                .preferredTheme(user.getPreferredTheme())
                .role(user.getRole().name())
                .isActive(user.isActive())
                .emailVerified(user.isEmailVerified())
                .createdAt(Objects.toString(user.getCreatedAt(), null))
                .updatedAt(Objects.toString(user.getUpdatedAt(), null))
                .build();
    }

    private AuthResponse createAuthenticatedResponse(User user, boolean rememberMe) {
        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String sessionId = activityService.createAuthenticatedSession(user, rememberMe);
        String accessToken = jwtService.generateAccessToken(userDetails, user.getId(), rememberMe, sessionId);
        String refreshToken = jwtService.generateRefreshToken(userDetails, user.getId(), rememberMe, sessionId);

        clearLoginVerificationCode(user);
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        log.info("User logged in: {}", user.getEmail());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .user(mapToUserDto(user))
                .requiresLoginVerification(false)
                .build();
    }

    private User getUserFromLoginVerificationToken(String token) {
        if (!jwtService.isLoginVerificationToken(token)) {
            throw new RuntimeException("Invalid login verification token");
        }

        String email = jwtService.extractEmail(token);
        Long userId = jwtService.extractUserId(token);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!Objects.equals(user.getId(), userId)) {
            throw new RuntimeException("Invalid login verification token");
        }

        return user;
    }

    private void issueLoginVerificationChallenge(User user) {
        String code = generateSixDigitCode();
        user.setLoginVerificationCode(code);
        user.setLoginVerificationCodeExpiry(LocalDateTime.now().plusMinutes(15));
        userRepository.save(user);

        emailService.sendLoginAccessCode(user.getEmail(), user.getFirstName(), code);
        log.info("Login verification challenge issued for {}", user.getEmail());
    }

    private void clearLoginVerificationCode(User user) {
        user.setLoginVerificationCode(null);
        user.setLoginVerificationCodeExpiry(null);
    }

    private String generateSixDigitCode() {
        return String.valueOf(ThreadLocalRandom.current().nextInt(100000, 1_000_000));
    }

    private User syncGoogleUser(User user, GoogleIdToken.Payload payload) {
        boolean changed = false;
        String googleId = payload.getSubject();

        if (googleId != null && !googleId.equals(user.getGoogleId())) {
            if (userRepository.existsByGoogleId(googleId) && userRepository.findByGoogleId(googleId).map(User::getId).filter(id -> !id.equals(user.getId())).isPresent()) {
                throw new RuntimeException("This Google account is already linked to another user");
            }
            user.setGoogleId(googleId);
            changed = true;
        }

        String googleEmail = payload.getEmail();
        if (googleEmail != null && !googleEmail.equalsIgnoreCase(Objects.toString(user.getGoogleEmail(), ""))) {
            user.setGoogleEmail(googleEmail);
            changed = true;
        }

        if (!user.isEmailVerified()) {
            user.setEmailVerified(true);
            user.setVerificationToken(null);
            user.setVerificationTokenExpiry(null);
            changed = true;
        }

        String firstName = normalizeName((String) payload.get("given_name"), "Google");
        String lastName = normalizeName((String) payload.get("family_name"), "User");

        if (user.getFirstName() == null || user.getFirstName().isBlank()) {
            user.setFirstName(firstName);
            changed = true;
        }

        if (user.getLastName() == null || user.getLastName().isBlank()) {
            user.setLastName(lastName);
            changed = true;
        }

        return changed ? userRepository.save(user) : user;
    }

    private User createGoogleUser(GoogleIdToken.Payload payload) {
        String email = payload.getEmail();
        String firstName = normalizeName((String) payload.get("given_name"), "Google");
        String lastName = normalizeName((String) payload.get("family_name"), "User");

        User user = User.builder()
                .firstName(firstName)
                .lastName(lastName)
                .email(email)
                .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                .googleId(payload.getSubject())
                .googleEmail(email)
                .role(Role.STANDARD)
                .isActive(true)
                .emailVerified(true)
                .build();

        return userRepository.save(user);
    }

    private String normalizeName(String value, String fallback) {
        if (value == null || value.isBlank()) {
            return fallback;
        }

        String trimmed = value.trim();
        if (trimmed.length() == 1) {
            return trimmed + fallback.charAt(0);
        }

        return trimmed.length() > 50 ? trimmed.substring(0, 50) : trimmed;
    }
}
