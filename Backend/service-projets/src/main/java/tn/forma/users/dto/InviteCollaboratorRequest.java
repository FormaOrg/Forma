package tn.forma.users.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import tn.forma.users.model.CollaboratorRole;

@Getter
@Setter
@NoArgsConstructor
public class InviteCollaboratorRequest {

    @NotBlank
    @Email
    private String email;

    @NotNull
    private CollaboratorRole role;
}
