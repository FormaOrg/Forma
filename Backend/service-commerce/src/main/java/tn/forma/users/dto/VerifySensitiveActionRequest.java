package tn.forma.users.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class VerifySensitiveActionRequest {

    @NotBlank(message = "Current password is required")
    private String currentPassword;
}
