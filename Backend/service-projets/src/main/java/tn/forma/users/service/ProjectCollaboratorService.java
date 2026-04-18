package tn.forma.users.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import tn.forma.users.dto.InviteCollaboratorRequest;
import tn.forma.users.dto.ProjectCollaboratorDto;
import tn.forma.users.dto.UpdateCollaboratorRoleRequest;
import tn.forma.users.model.*;
import tn.forma.users.repository.ProjectCollaboratorRepository;
import tn.forma.users.repository.ProjectRepository;
import tn.forma.users.repository.UserRepository;

import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProjectCollaboratorService {

    private final ProjectCollaboratorRepository collaboratorRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final CollaboratorEmailService collaboratorEmailService;

    @Transactional(readOnly = true)
    public List<ProjectCollaboratorDto> getCollaborators(String ownerEmail, Long projectId) {
        Project project = getOwnedProject(ownerEmail, projectId);
        return collaboratorRepository.findAllByProjectId(project.getId())
                .stream()
                .map(this::mapToDto)
                .toList();
    }

    @Transactional
    public ProjectCollaboratorDto inviteCollaborator(String ownerEmail, Long projectId, InviteCollaboratorRequest request) {
        User owner = getUserByEmail(ownerEmail);
        Project project = getOwnedProjectForUser(owner, projectId);

        String inviteEmail = request.getEmail().trim().toLowerCase();

        if (inviteEmail.equalsIgnoreCase(ownerEmail)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You cannot invite yourself as a collaborator");
        }

        if (collaboratorRepository.findByProjectIdAndInviteEmail(projectId, inviteEmail).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An invitation has already been sent to this email");
        }

        Optional<User> inviteeUser = userRepository.findByEmail(inviteEmail);

        ProjectCollaborator collaborator = ProjectCollaborator.builder()
                .project(project)
                .user(inviteeUser.orElse(null))
                .inviteEmail(inviteEmail)
                .role(request.getRole())
                .status(CollaboratorStatus.PENDING)
                .invitationToken(UUID.randomUUID().toString())
                .invitationTokenExpiry(LocalDateTime.now().plusDays(7))
                .build();

        ProjectCollaborator saved = collaboratorRepository.save(collaborator);

        String ownerName = buildFullName(owner);
        collaboratorEmailService.sendCollaboratorInviteEmail(
                inviteEmail,
                ownerName,
                project.getName(),
                request.getRole().name(),
                saved.getInvitationToken()
        );

        log.info("Collaborator invited: {} to project {} as {}", inviteEmail, projectId, request.getRole());
        return mapToDto(saved);
    }

    @Transactional
    public void removeCollaborator(String ownerEmail, Long projectId, Long collaboratorId) {
        getOwnedProject(ownerEmail, projectId);
        ProjectCollaborator collaborator = collaboratorRepository.findByIdAndProjectId(collaboratorId, projectId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Collaborator not found"));
        collaboratorRepository.delete(collaborator);
        log.info("Collaborator {} removed from project {}", collaboratorId, projectId);
    }

    @Transactional
    public ProjectCollaboratorDto updateCollaboratorRole(String ownerEmail, Long projectId, Long collaboratorId, UpdateCollaboratorRoleRequest request) {
        getOwnedProject(ownerEmail, projectId);
        ProjectCollaborator collaborator = collaboratorRepository.findByIdAndProjectId(collaboratorId, projectId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Collaborator not found"));
        collaborator.setRole(request.getRole());
        return mapToDto(collaboratorRepository.save(collaborator));
    }

    @Transactional
    public void deleteAllForProject(Long projectId) {
        collaboratorRepository.deleteAllByProjectId(projectId);
    }

    @Transactional
    public ProjectCollaboratorDto acceptInvitation(String inviteeEmail, String token) {
        User invitee = getUserByEmail(inviteeEmail);
        ProjectCollaborator collaborator = collaboratorRepository.findByInvitationToken(token)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Invitation not found"));

        if (!collaborator.getInviteEmail().equalsIgnoreCase(invitee.getEmail())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This invitation was sent to a different email address");
        }

        User linkedUser = collaborator.getUser();
        if (linkedUser != null && !Objects.equals(linkedUser.getId(), invitee.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This invitation is already linked to another account");
        }

        if (collaborator.getStatus() == CollaboratorStatus.ACCEPTED && linkedUser != null) {
            return mapToDto(collaborator);
        }

        if (!collaborator.isInvitationTokenValid()) {
            throw new ResponseStatusException(HttpStatus.GONE, "Invitation link has expired");
        }

        collaborator.setUser(invitee);
        collaborator.setStatus(CollaboratorStatus.ACCEPTED);
        collaborator.setAcceptedAt(LocalDateTime.now());

        ProjectCollaborator saved = collaboratorRepository.save(collaborator);
        log.info("Collaborator invitation {} accepted by {}", collaborator.getId(), invitee.getEmail());
        return mapToDto(saved);
    }

    @Transactional(readOnly = true)
    public List<Project> getAcceptedCollaboratorProjects(User user) {
        return collaboratorRepository.findAllByUserIdAndStatus(user.getId(), CollaboratorStatus.ACCEPTED)
                .stream()
                .map(ProjectCollaborator::getProject)
                .toList();
    }

    @Transactional(readOnly = true)
    public boolean hasAcceptedAccess(Long projectId, Long userId) {
        return collaboratorRepository.findByProjectIdAndUserIdAndStatus(projectId, userId, CollaboratorStatus.ACCEPTED)
                .isPresent();
    }

    @Transactional(readOnly = true)
    public boolean hasAcceptedEditorAccess(Long projectId, Long userId) {
        return collaboratorRepository.findByProjectIdAndUserIdAndStatus(projectId, userId, CollaboratorStatus.ACCEPTED)
                .map(ProjectCollaborator::getRole)
                .filter(role -> role == CollaboratorRole.EDITOR)
                .isPresent();
    }

    private Project getOwnedProject(String email, Long projectId) {
        User user = getUserByEmail(email);
        return getOwnedProjectForUser(user, projectId);
    }

    private Project getOwnedProjectForUser(User user, Long projectId) {
        return projectRepository.findByIdAndUserId(projectId, user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Project not found or access denied"));
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    @Transactional(readOnly = true)
    public Optional<ProjectCollaboratorDto> getMyPendingInvitation(String email, Long projectId) {
        String normalizedEmail = email.trim().toLowerCase();
        return collaboratorRepository.findByProjectIdAndInviteEmail(projectId, normalizedEmail)
                .filter(c -> c.getStatus() == CollaboratorStatus.PENDING)
                .map(this::mapToDto);
    }

    private ProjectCollaboratorDto mapToDto(ProjectCollaborator c) {
        User invitee = c.getUser();
        return ProjectCollaboratorDto.builder()
                .id(c.getId())
                .projectId(c.getProject().getId())
                .userId(invitee != null ? invitee.getId() : null)
                .inviteEmail(c.getInviteEmail())
                .role(c.getRole())
                .status(c.getStatus())
                .invitedAt(Objects.toString(c.getInvitedAt(), null))
                .acceptedAt(Objects.toString(c.getAcceptedAt(), null))
                .userName(invitee != null ? buildFullName(invitee) : null)
                .userAvatarUrl(invitee != null ? invitee.getAvatarUrl() : null)
                .invitationToken(c.getStatus() == CollaboratorStatus.PENDING ? c.getInvitationToken() : null)
                .build();
    }

    private String buildFullName(User user) {
        String first = user.getFirstName() != null ? user.getFirstName().trim() : "";
        String last = user.getLastName() != null ? user.getLastName().trim() : "";
        String full = (first + " " + last).trim();
        return full.isEmpty() ? user.getEmail() : full;
    }
}
