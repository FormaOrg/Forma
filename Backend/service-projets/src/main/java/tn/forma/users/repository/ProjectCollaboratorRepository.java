package tn.forma.users.repository;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import tn.forma.users.model.ProjectCollaborator;

import java.util.List;
import java.util.Optional;

public interface ProjectCollaboratorRepository extends JpaRepository<ProjectCollaborator, Long> {

    @EntityGraph(attributePaths = {"project", "user"})
    List<ProjectCollaborator> findAllByProjectId(Long projectId);

    Optional<ProjectCollaborator> findByProjectIdAndInviteEmail(Long projectId, String inviteEmail);

    @EntityGraph(attributePaths = {"project", "user"})
    Optional<ProjectCollaborator> findByIdAndProjectId(Long id, Long projectId);

    @EntityGraph(attributePaths = {"project", "user"})
    List<ProjectCollaborator> findAllByUserIdAndStatus(Long userId, tn.forma.users.model.CollaboratorStatus status);

    List<ProjectCollaborator> findAllByInviteEmailIgnoreCaseAndStatus(String inviteEmail, tn.forma.users.model.CollaboratorStatus status);

    Optional<ProjectCollaborator> findByProjectIdAndUserIdAndStatus(Long projectId, Long userId, tn.forma.users.model.CollaboratorStatus status);

    Optional<ProjectCollaborator> findByInvitationToken(String invitationToken);

    void deleteAllByProjectId(Long projectId);
}
