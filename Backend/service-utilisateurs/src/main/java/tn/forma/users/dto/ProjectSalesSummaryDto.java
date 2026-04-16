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
public class ProjectSalesSummaryDto {
    private BigDecimal revenue;
    private double revenueChangePercent;
    private long orders;
    private double ordersChangePercent;
    private BigDecimal averageOrderValue;
    private double averageOrderValueChangePercent;
    private long awaitingDelivery;
    private long awaitingDeliveryChange;
    private long delivered;
    private double deliveredChangePercent;
    private double averageDeliveryDays;
    private double averageDeliveryDaysChange;
}
