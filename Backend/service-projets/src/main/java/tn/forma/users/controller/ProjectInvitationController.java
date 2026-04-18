package tn.forma.users.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import tn.forma.users.dto.AcceptCollaboratorInviteRequest;
import tn.forma.users.dto.ProjectCollaboratorDto;
import tn.forma.users.service.ProjectCollaboratorService;

@RestController
@RequestMapping("/api/projects/invitations")
@RequiredArgsConstructor
public class ProjectInvitationController {

    private final ProjectCollaboratorService projectCollaboratorService;

    @PostMapping("/accept")
    public ResponseEntity<ProjectCollaboratorDto> acceptInvitation(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody AcceptCollaboratorInviteRequest request) {
        return ResponseEntity.ok(projectCollaboratorService.acceptInvitation(userDetails.getUsername(), request.getToken()));
    }
}
