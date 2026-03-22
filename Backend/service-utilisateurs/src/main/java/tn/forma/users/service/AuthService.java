package tn.forma.users.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import tn.forma.users.dto.*;
import tn.forma.users.model.Role;
import tn.forma.users.model.User;
import tn.forma.users.repository.UserRepository;
import tn.forma.users.security.UserDetailsServiceImpl;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

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
        // Authenticate — throws if credentials are wrong
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!user.isEmailVerified()) {
            throw new RuntimeException("Please verify your email before logging in");
        }

        if (!user.isActive()) {
            throw new RuntimeException("Account is disabled");
        }

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String accessToken  = jwtService.generateAccessToken(userDetails, user.getId());
        String refreshToken = jwtService.generateRefreshToken(userDetails, user.getId());

        log.info("User logged in: {}", user.getEmail());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .user(mapToUserDto(user))
                .build();
    }

    // ── Refresh token ──────────────────────────────────────

    public AuthResponse refresh(String refreshToken) {
        if (!jwtService.isRefreshToken(refreshToken)) {
            throw new RuntimeException("Invalid refresh token");
        }

        String email = jwtService.extractEmail(refreshToken);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        UserDetails userDetails = userDetailsService.loadUserByUsername(email);

        if (!jwtService.isTokenValid(refreshToken, userDetails)) {
            throw new RuntimeException("Refresh token expired");
        }

        String newAccessToken  = jwtService.generateAccessToken(userDetails, user.getId());
        String newRefreshToken = jwtService.generateRefreshToken(userDetails, user.getId());

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

    // ── Private helpers ────────────────────────────────────

    private UserDto mapToUserDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(user.getRole().name())
                .emailVerified(user.isEmailVerified())
                .build();
    }
}