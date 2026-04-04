package tn.forma.users.repository;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tn.forma.users.model.ProjectOrder;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ProjectOrderRepository extends JpaRepository<ProjectOrder, Long> {

    @EntityGraph(attributePaths = {"customer", "items", "items.product"})
    List<ProjectOrder> findAllByProjectIdOrderByPlacedAtDesc(Long projectId);

    @EntityGraph(attributePaths = {"customer", "items", "items.product"})
    List<ProjectOrder> findAllByProjectIdAndPlacedAtGreaterThanEqualAndPlacedAtLessThanOrderByPlacedAtDesc(
            Long projectId,
            LocalDateTime startInclusive,
            LocalDateTime endExclusive
    );
}
