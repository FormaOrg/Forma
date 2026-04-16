package tn.forma.users.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tn.forma.users.model.ProjectProduct;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectProductRepository extends JpaRepository<ProjectProduct, Long> {
    List<ProjectProduct> findAllByProjectIdOrderByUpdatedAtDesc(Long projectId);
    Optional<ProjectProduct> findByIdAndProjectId(Long id, Long projectId);
}
