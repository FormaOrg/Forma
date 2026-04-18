package tn.forma.users.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tn.forma.users.model.Project;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
    List<Project> findAllByUserIdOrderByUpdatedAtDesc(Long userId);
    Optional<Project> findByIdAndUserId(Long id, Long userId);
    Optional<Project> findByDefaultDomainIgnoreCaseAndPublishedTrue(String defaultDomain);
    long countByUserId(Long userId);
    long countByUserIdAndStatus(Long userId, tn.forma.users.model.ProjectStatus status);
}
