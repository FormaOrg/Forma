package tn.forma.users.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SecuritySettingsResponse {
    private String email;
    private boolean loginVerificationEnabled;
    private String securityQuestion1;
    private String securityQuestion2;
    private String recoveryEmail;
    private String recoveryPhone;
}
