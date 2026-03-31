package tn.forma.users.dto;

import jakarta.validation.constraints.Email;
import lombok.Data;

@Data
public class UpdateRecoveryOptionsRequest {
    private String currentPassword;

    private String verificationToken;

    @Email(message = "Recovery email must be valid")
    private String recoveryEmail;

    private String recoveryPhone;
}
