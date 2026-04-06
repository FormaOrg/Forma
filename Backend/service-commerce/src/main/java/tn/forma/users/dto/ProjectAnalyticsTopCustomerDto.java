package tn.forma.users.dto;

import lombok.Builder;

import java.math.BigDecimal;

@Builder
public record ProjectAnalyticsTopCustomerDto(
        Long customerId,
        String name,
        String zoneLabel,
        long orders,
        BigDecimal revenue,
        double growthPercent
) {
}
