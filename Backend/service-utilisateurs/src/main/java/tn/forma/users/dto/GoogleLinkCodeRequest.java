package tn.forma.users.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class GoogleLinkCodeRequest {
    @NotBlank
    private String code;

    @NotBlank
    private String redirectUri;
}
