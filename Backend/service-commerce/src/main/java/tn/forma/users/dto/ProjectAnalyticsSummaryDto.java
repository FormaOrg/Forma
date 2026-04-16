package tn.forma.users.dto;

import lombok.Builder;

import java.math.BigDecimal;

@Builder
public record ProjectAnalyticsSummaryDto(
        long customers,
        double customersChangePercent,
        long orders,
        double ordersChangePercent,
        BigDecimal revenue,
        double revenueChangePercent,
        BigDecimal averageOrderValue,
        double averageOrderValueChangePercent
) {
}
