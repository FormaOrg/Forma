package tn.forma.users.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import tn.forma.users.dto.*;
import tn.forma.users.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(
            @Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @GetMapping("/google/config")
    public ResponseEntity<GoogleClientConfigResponse> googleConfig() {
        return ResponseEntity.ok(new GoogleClientConfigResponse(authService.getGoogleClientId()));
    }

    @GetMapping("/google/link-config")
    public ResponseEntity<GoogleLinkConfigResponse> googleLinkConfig(HttpServletRequest request) {
        return ResponseEntity.ok(authService.getGoogleLinkConfig(request));
    }

    @PostMapping("/google")
    public ResponseEntity<AuthResponse> googleLogin(
            @Valid @RequestBody GoogleAuthRequest request) {
        return ResponseEntity.ok(authService.loginWithGoogle(request));
    }

    @PostMapping("/google/code")
    public ResponseEntity<AuthResponse> googleLoginWithCode(
            @Valid @RequestBody GoogleAuthCodeRequest request) {
        return ResponseEntity.ok(authService.loginWithGoogleCode(request));
    }

    @PostMapping("/login/verify")
    public ResponseEntity<AuthResponse> verifyLogin(
            @Valid @RequestBody LoginVerificationRequest request) {
        return ResponseEntity.ok(authService.verifyLogin(request));
    }

    @PostMapping("/login-verification/resend")
    public ResponseEntity<MessageResponse> resendLoginVerification(
            @Valid @RequestBody LoginVerificationTokenRequest request) {
        return ResponseEntity.ok(authService.resendLoginVerification(request.getToken()));
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(
            @RequestBody RefreshTokenRequest request) {
        return ResponseEntity.ok(authService.refresh(request.getRefreshToken()));
    }

    @PostMapping("/verify-email")
    public ResponseEntity<MessageResponse> verifyEmail(
            @RequestBody TokenRequest request) {
        return ResponseEntity.ok(authService.verifyEmail(request.getToken()));
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<MessageResponse> resendVerification(
            @RequestBody EmailRequest request) {
        return ResponseEntity.ok(authService.resendVerification(request.getEmail()));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<MessageResponse> forgotPassword(
            @RequestBody EmailRequest request) {
        return ResponseEntity.ok(authService.forgotPassword(request.getEmail()));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<MessageResponse> resetPassword(
            @RequestBody ResetPasswordRequest request) {
        return ResponseEntity.ok(
                authService.resetPassword(request.getToken(), request.getNewPassword())
        );
    }
}
