package tn.forma.users.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class BillingOverviewDto {
    private BillingSubscriptionDto subscription;
    private List<BillingUsageMetricDto> usage;
    private BillingPaymentMethodDto paymentMethod;
    private List<BillingInvoiceDto> invoices;
    private long activeProjectsCount;
    private long paidInvoicesCount;
    private String currentSpendLabel;
}
