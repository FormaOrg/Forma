package tn.forma.users.repository;

import tn.forma.users.model.LoginHistoryEntry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LoginHistoryEntryRepository extends JpaRepository<LoginHistoryEntry, Long> {
    List<LoginHistoryEntry> findTop100ByUserIdOrderByCreatedAtDesc(Long userId);
    List<LoginHistoryEntry> findTop100ByAttemptedEmailIgnoreCaseOrderByCreatedAtDesc(String attemptedEmail);
}
