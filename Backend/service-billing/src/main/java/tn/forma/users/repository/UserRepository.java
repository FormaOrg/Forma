package tn.forma.users.repository;

import tn.forma.users.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);
    Optional<User> findByEmailIgnoreCase(String email);
    Optional<User> findByGoogleId(String googleId);
    Optional<User> findByGoogleEmailIgnoreCase(String googleEmail);
    Optional<User> findByVerificationToken(String token);
    boolean existsByEmail(String email);
    boolean existsByGoogleId(String googleId);
    boolean existsByUsername(String username);
}
