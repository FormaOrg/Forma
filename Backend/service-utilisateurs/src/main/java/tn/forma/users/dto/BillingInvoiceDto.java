package tn.forma.users.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class BillingInvoiceDto {
    private String id;
    private String dateLabel;
    private String amountLabel;
    private String statusLabel;
    private String downloadUrl;
}
