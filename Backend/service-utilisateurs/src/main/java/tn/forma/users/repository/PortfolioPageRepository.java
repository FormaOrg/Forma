package tn.forma.users.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tn.forma.users.model.PortfolioPage;

import java.util.List;

@Repository
public interface PortfolioPageRepository extends JpaRepository<PortfolioPage, Long> {
    List<PortfolioPage> findAllByProjectIdOrderBySortOrderAsc(Long projectId);
    long countByProjectId(Long projectId);
    void deleteAllByProjectId(Long projectId);
}
