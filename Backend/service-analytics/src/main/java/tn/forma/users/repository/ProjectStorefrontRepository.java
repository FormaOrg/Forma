package tn.forma.users.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tn.forma.users.model.ProjectStorefront;

import java.util.Optional;

@Repository
public interface ProjectStorefrontRepository extends JpaRepository<ProjectStorefront, Long> {
    Optional<ProjectStorefront> findByProjectId(Long projectId);
}
