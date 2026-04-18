package tn.forma.users.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import tn.forma.users.dto.InviteCollaboratorRequest;
import tn.forma.users.dto.MessageResponse;
import tn.forma.users.dto.ProjectCollaboratorDto;
import tn.forma.users.dto.UpdateCollaboratorRoleRequest;
import tn.forma.users.service.ProjectCollaboratorService;

import java.util.List;

@RestController
@RequestMapping("/api/projects/{projectId}/collaborators")
@RequiredArgsConstructor
public class ProjectCollaboratorController {

    private final ProjectCollaboratorService collaboratorService;

    @GetMapping("/my-invitation")
    public ResponseEntity<ProjectCollaboratorDto> getMyInvitation(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long projectId) {
        return collaboratorService.getMyPendingInvitation(userDetails.getUsername(), projectId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping
    public ResponseEntity<List<ProjectCollaboratorDto>> getCollaborators(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long projectId) {
        return ResponseEntity.ok(collaboratorService.getCollaborators(userDetails.getUsername(), projectId));
    }

    @PostMapping
    public ResponseEntity<ProjectCollaboratorDto> inviteCollaborator(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long projectId,
            @Valid @RequestBody InviteCollaboratorRequest request) {
        return ResponseEntity.ok(collaboratorService.inviteCollaborator(userDetails.getUsername(), projectId, request));
    }

    @DeleteMapping("/{collaboratorId}")
    public ResponseEntity<MessageResponse> removeCollaborator(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long projectId,
            @PathVariable Long collaboratorId) {
        collaboratorService.removeCollaborator(userDetails.getUsername(), projectId, collaboratorId);
        return ResponseEntity.ok(new MessageResponse("Collaborator removed"));
    }

    @PatchMapping("/{collaboratorId}/role")
    public ResponseEntity<ProjectCollaboratorDto> updateCollaboratorRole(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long projectId,
            @PathVariable Long collaboratorId,
            @Valid @RequestBody UpdateCollaboratorRoleRequest request) {
        return ResponseEntity.ok(collaboratorService.updateCollaboratorRole(userDetails.getUsername(), projectId, collaboratorId, request));
    }
}
