package tn.forma.users.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tn.forma.users.model.ProjectAnalyticsEvent;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ProjectAnalyticsEventRepository extends JpaRepository<ProjectAnalyticsEvent, Long> {

    List<ProjectAnalyticsEvent> findAllByProjectIdAndOccurredAtGreaterThanEqualAndOccurredAtLessThanOrderByOccurredAtAsc(
            Long projectId,
            LocalDateTime startInclusive,
            LocalDateTime endExclusive
    );
}
