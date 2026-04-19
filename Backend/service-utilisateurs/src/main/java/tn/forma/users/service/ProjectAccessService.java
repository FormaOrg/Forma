package tn.forma.users.service;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import tn.forma.users.model.CollaboratorRole;
import tn.forma.users.model.Project;
import tn.forma.users.model.User;
import tn.forma.users.repository.ProjectCollaboratorRepository;
import tn.forma.users.repository.ProjectRepository;
import tn.forma.users.repository.UserRepository;

@Service
@RequiredArgsConstructor
public class ProjectAccessService {

    private final ProjectRepository projectRepository;
    private final ProjectCollaboratorRepository collaboratorRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public User getRequiredUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    @Transactional(readOnly = true)
    public Project getOwnedProject(String email, Long projectId) {
        User user = getRequiredUser(email);
        return projectRepository.findByIdAndUserId(projectId, user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Project not found or access denied"));
    }

    @Transactional(readOnly = true)
    public Project getAccessibleProject(String email, Long projectId) {
        User user = getRequiredUser(email);
        return projectRepository.findByIdAndUserId(projectId, user.getId())
                .orElseGet(() -> projectRepository.findById(projectId)
                        .filter(project -> hasAcceptedAccess(projectId, user.getId()))
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found")));
    }

    @Transactional(readOnly = true)
    public Project getEditableProject(String email, Long projectId) {
        User user = getRequiredUser(email);
        return projectRepository.findByIdAndUserId(projectId, user.getId())
                .orElseGet(() -> projectRepository.findById(projectId)
                        .filter(project -> hasAcceptedEditorAccess(projectId, user.getId()))
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Project not found or access denied")));
    }

    @Transactional(readOnly = true)
    public void ensureOwnedProject(String email, Long projectId) {
        getOwnedProject(email, projectId);
    }

    @Transactional(readOnly = true)
    public void ensureEditableProject(String email, Long projectId) {
        getEditableProject(email, projectId);
    }

    @Transactional(readOnly = true)
    public boolean hasAcceptedAccess(Long projectId, Long userId) {
        return collaboratorRepository.findByProjectIdAndUserIdAndStatus(
                        projectId,
                        userId,
                        tn.forma.users.model.CollaboratorStatus.ACCEPTED
                )
                .isPresent();
    }

    @Transactional(readOnly = true)
    public boolean hasAcceptedEditorAccess(Long projectId, Long userId) {
        return collaboratorRepository.findByProjectIdAndUserIdAndStatus(
                        projectId,
                        userId,
                        tn.forma.users.model.CollaboratorStatus.ACCEPTED
                )
                .map(collaborator -> collaborator.getRole() == CollaboratorRole.EDITOR)
                .orElse(false);
    }
}
