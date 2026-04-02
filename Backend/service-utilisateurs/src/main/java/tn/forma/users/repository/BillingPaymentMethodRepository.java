package tn.forma.users.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tn.forma.users.model.BillingPaymentMethod;

import java.util.Optional;

@Repository
public interface BillingPaymentMethodRepository extends JpaRepository<BillingPaymentMethod, Long> {
    Optional<BillingPaymentMethod> findByUserId(Long userId);
}
