package tn.forma.users.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class AcceptCollaboratorInviteRequest {

    @NotBlank
    private String token;
}
