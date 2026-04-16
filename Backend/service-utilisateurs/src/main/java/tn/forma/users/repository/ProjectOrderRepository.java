package tn.forma.users.repository;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import tn.forma.users.model.ProjectOrder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

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

    @EntityGraph(attributePaths = {"customer", "items", "items.product"})
    Optional<ProjectOrder> findByIdAndProjectId(Long id, Long projectId);

        @EntityGraph(attributePaths = {"customer", "items", "items.product"})
        List<ProjectOrder> findAllByProjectIdAndCustomerIdOrderByPlacedAtDesc(Long projectId, Long customerId);

    List<ProjectOrder> findAllByIdInAndProjectId(List<Long> ids, Long projectId);

    @Query("""
            select distinct order
            from ProjectOrder order
            join fetch order.items items
            left join fetch order.customer
            left join fetch items.product
            where order.project.id = :projectId
              and items.product.id = :productId
            """)
    List<ProjectOrder> findAllByProjectIdAndProductId(Long projectId, Long productId);
}
