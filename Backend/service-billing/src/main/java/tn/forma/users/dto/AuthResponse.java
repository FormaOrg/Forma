package tn.forma.users.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String accessToken;
    private String refreshToken;
    private UserDto user;
    private Boolean requiresLoginVerification;
    private String loginVerificationToken;
    private String message;
}
