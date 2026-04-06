package tn.forma.users.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginVerificationTokenRequest {

    @NotBlank(message = "Verification token is required")
    private String token;
}
