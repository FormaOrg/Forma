package tn.forma.users.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class SensitiveActionVerificationResponse {
    private String token;
    private String message;
}
