package tn.forma.users.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectSalesOrderRowDto {
    private Long id;
    private String orderNumber;
    private String customerName;
    private String placedAt;
    private String paymentStatus;
    private String fulfillmentStatus;
    private BigDecimal total;
}
