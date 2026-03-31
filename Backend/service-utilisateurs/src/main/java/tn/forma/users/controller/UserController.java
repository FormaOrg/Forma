package tn.forma.users.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import tn.forma.users.dto.*;
import tn.forma.users.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // ── Current user ───────────────────────────────────────

    @GetMapping("/me")
    public ResponseEntity<UserDto> getMe(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(userService.getMe(userDetails.getUsername()));
    }

    @GetMapping("/me/security")
    public ResponseEntity<SecuritySettingsResponse> getSecuritySettings(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(userService.getSecuritySettings(userDetails.getUsername()));
    }

    @GetMapping("/me/session-valid")
    public ResponseEntity<MessageResponse> validateCurrentSession(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(new MessageResponse("Session is valid"));
    }

    @GetMapping("/me/activity/sessions")
    public ResponseEntity<List<ActivitySessionResponse>> getActiveSessions(
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest request) {
        return ResponseEntity.ok(
                userService.getActiveSessions(
                        userDetails.getUsername(),
                        extractCurrentSessionId(request)
                )
        );
    }

    @GetMapping("/me/activity/login-history")
    public ResponseEntity<List<LoginHistoryEntryResponse>> getLoginHistory(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(userService.getLoginHistory(userDetails.getUsername()));
    }

    @DeleteMapping("/me/activity/sessions/{sessionId}")
    public ResponseEntity<MessageResponse> signOutSession(
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest request,
            @PathVariable String sessionId) {
        return ResponseEntity.ok(
                userService.signOutSession(
                        userDetails.getUsername(),
                        extractCurrentSessionId(request),
                        sessionId
                )
        );
    }

    @PostMapping("/me/activity/sessions/sign-out-others")
    public ResponseEntity<MessageResponse> signOutOtherSessions(
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest request) {
        return ResponseEntity.ok(
                userService.signOutOtherSessions(
                        userDetails.getUsername(),
                        extractCurrentSessionId(request)
                )
        );
    }

    @PutMapping("/me")
    public ResponseEntity<UserDto> updateMe(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(userService.updateMe(userDetails.getUsername(), request));
    }

    @PatchMapping("/me/password")
    public ResponseEntity<MessageResponse> changePassword(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody ChangePasswordRequest request) {
        userService.changePassword(
                userDetails.getUsername(),
                request.getCurrentPassword(),
                request.getNewPassword()
        );
        return ResponseEntity.ok(new MessageResponse("Password changed successfully"));
    }

    @PostMapping("/me/security/verify")
    public ResponseEntity<SensitiveActionVerificationResponse> verifySensitiveSecurityAction(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody VerifySensitiveActionRequest request) {
        return ResponseEntity.ok(
                userService.verifySensitiveSecurityAction(
                        userDetails.getUsername(),
                        request.getCurrentPassword()
                )
        );
    }

    @PutMapping("/me/security-questions")
    public ResponseEntity<MessageResponse> updateSecurityQuestions(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody UpdateSecurityQuestionsRequest request) {
        return ResponseEntity.ok(userService.updateSecurityQuestions(userDetails.getUsername(), request));
    }

    @PutMapping("/me/recovery-options")
    public ResponseEntity<MessageResponse> updateRecoveryOptions(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody UpdateRecoveryOptionsRequest request) {
        return ResponseEntity.ok(userService.updateRecoveryOptions(userDetails.getUsername(), request));
    }

    @PostMapping("/me/login-verification/request")
    public ResponseEntity<MessageResponse> requestLoginVerificationChange(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody RequestLoginVerificationChangeRequest request) {
        return ResponseEntity.ok(userService.requestLoginVerificationChange(userDetails.getUsername(), request));
    }

    @PostMapping("/me/login-verification/confirm")
    public ResponseEntity<MessageResponse> confirmLoginVerificationChange(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ConfirmLoginVerificationChangeRequest request) {
        return ResponseEntity.ok(userService.confirmLoginVerificationChange(userDetails.getUsername(), request));
    }

    @PostMapping("/me/login-verification/disable")
    public ResponseEntity<MessageResponse> disableLoginVerification(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(userService.disableLoginVerification(userDetails.getUsername()));
    }

    @PostMapping("/me/email-change")
    public ResponseEntity<MessageResponse> requestEmailChange(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody RequestEmailChangeRequest request) {
        return ResponseEntity.ok(userService.requestEmailChange(userDetails.getUsername(), request));
    }

    @PostMapping("/me/email-change/resend")
    public ResponseEntity<MessageResponse> resendEmailChangeCode(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(userService.resendEmailChangeCode(userDetails.getUsername()));
    }

    @PostMapping("/me/email-change/confirm")
    public ResponseEntity<AuthResponse> confirmEmailChange(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ConfirmEmailChangeRequest request) {
        return ResponseEntity.ok(userService.confirmEmailChange(userDetails.getUsername(), request));
    }

    // ── Admin ──────────────────────────────────────────────

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserDto>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDto> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @PatchMapping("/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDto> updateRole(
            @PathVariable Long id,
            @RequestBody RoleUpdateRequest request) {
        return ResponseEntity.ok(userService.updateRole(id, request.getRole()));
    }

    @PatchMapping("/{id}/toggle-active")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDto> toggleActive(@PathVariable Long id) {
        return ResponseEntity.ok(userService.toggleActive(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    private String extractCurrentSessionId(HttpServletRequest request) {
        String authorization = request.getHeader("Authorization");
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            return null;
        }

        try {
            return userService.extractSessionIdFromAccessToken(authorization.substring(7));
        } catch (Exception ignored) {
            return null;
        }
    }
}
