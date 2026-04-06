package tn.forma.users.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class BillingSubscriptionDto {
    private String planName;
    private String planDescription;
    private String status;
    private String billingMode;
    private String billingCycleLabel;
    private String renewalDateLabel;
    private String nextChargeLabel;
    private String promoNotice;
}
