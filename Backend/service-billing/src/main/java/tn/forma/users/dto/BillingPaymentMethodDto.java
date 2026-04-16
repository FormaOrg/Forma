package tn.forma.users.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class BillingPaymentMethodDto {
    private String brand;
    private String last4;
    private String expiryLabel;
    private String contactEmail;
    private String summary;
}
