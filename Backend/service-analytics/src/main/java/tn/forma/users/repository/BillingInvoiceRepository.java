package tn.forma.users.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tn.forma.users.model.BillingInvoice;
import tn.forma.users.model.BillingInvoiceStatus;

import java.util.List;

@Repository
public interface BillingInvoiceRepository extends JpaRepository<BillingInvoice, Long> {
    List<BillingInvoice> findTop8BySubscriptionUserIdOrderByInvoiceDateDescCreatedAtDesc(Long userId);
    long countBySubscriptionUserIdAndStatus(Long userId, BillingInvoiceStatus status);
}
