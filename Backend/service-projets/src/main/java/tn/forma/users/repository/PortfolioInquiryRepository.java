package tn.forma.users.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tn.forma.users.model.PortfolioInquiry;

import java.util.List;
import java.util.Optional;

@Repository
public interface PortfolioInquiryRepository extends JpaRepository<PortfolioInquiry, Long> {
    List<PortfolioInquiry> findAllByProjectIdOrderByCreatedAtDesc(Long projectId);
    Optional<PortfolioInquiry> findByIdAndProjectId(Long inquiryId, Long projectId);
    void deleteAllByProjectId(Long projectId);
}
