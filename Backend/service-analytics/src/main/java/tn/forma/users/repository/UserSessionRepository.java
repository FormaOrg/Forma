package tn.forma.users.repository;

import tn.forma.users.model.UserSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserSessionRepository extends JpaRepository<UserSession, Long> {
    List<UserSession> findByUserIdAndRevokedFalseOrderByLastActiveAtDesc(Long userId);
    Optional<UserSession> findBySessionId(String sessionId);
    boolean existsBySessionIdAndRevokedFalse(String sessionId);
}
