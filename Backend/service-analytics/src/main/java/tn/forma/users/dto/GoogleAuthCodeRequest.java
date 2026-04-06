package tn.forma.users.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GoogleAuthCodeRequest {
    @NotBlank
    private String code;

    @NotBlank
    private String redirectUri;

    private boolean rememberMe;
}
