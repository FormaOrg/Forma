package tn.forma.users.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class GoogleLinkRequest {
    @NotBlank
    private String idToken;
}
