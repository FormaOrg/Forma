package tn.forma.users.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.forma.users.model.ProjectMedia;

import java.util.List;
import java.util.Optional;

public interface ProjectMediaRepository extends JpaRepository<ProjectMedia, Long> {
    List<ProjectMedia> findAllByProjectIdOrderByUploadedAtDesc(Long projectId);
    Optional<ProjectMedia> findByIdAndProjectId(Long id, Long projectId);
    Optional<ProjectMedia> findFirstByProjectIdAndFileUrl(Long projectId, String fileUrl);
}
