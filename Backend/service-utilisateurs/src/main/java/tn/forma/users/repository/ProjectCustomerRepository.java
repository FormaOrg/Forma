package tn.forma.users.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tn.forma.users.model.ProjectCustomer;

import java.util.List;

@Repository
public interface ProjectCustomerRepository extends JpaRepository<ProjectCustomer, Long> {
    List<ProjectCustomer> findAllByProjectIdOrderByCreatedAtDesc(Long projectId);
    java.util.Optional<ProjectCustomer> findByIdAndProjectId(Long id, Long projectId);
}
