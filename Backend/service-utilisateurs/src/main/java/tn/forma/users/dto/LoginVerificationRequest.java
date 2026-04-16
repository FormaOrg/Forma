package tn.forma.users.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginVerificationRequest {

    @NotBlank(message = "Verification token is required")
    private String token;

    @NotBlank(message = "Verification code is required")
    private String code;
}
