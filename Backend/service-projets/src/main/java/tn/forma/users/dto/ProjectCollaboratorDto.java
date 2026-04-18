package tn.forma.users.dto;

import lombok.*;
import tn.forma.users.model.CollaboratorRole;
import tn.forma.users.model.CollaboratorStatus;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectCollaboratorDto {
    private Long id;
    private Long projectId;
    private Long userId;
    private String inviteEmail;
    private CollaboratorRole role;
    private CollaboratorStatus status;
    private String invitedAt;
    private String acceptedAt;
    private String userName;
    private String userAvatarUrl;
}
