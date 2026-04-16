package tn.forma.users.dto;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class PublicStorefrontCustomerOrderDto {
    private Long orderId;
    private String orderNumber;
    private String placedAt;
    private String paymentStatus;
    private String fulfillmentStatus;
    private BigDecimal total;
}
