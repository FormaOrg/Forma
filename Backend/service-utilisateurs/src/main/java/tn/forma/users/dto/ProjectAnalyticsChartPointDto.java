package tn.forma.users.dto;

import lombok.Builder;

import java.math.BigDecimal;

@Builder
public record ProjectAnalyticsChartPointDto(
        String isoDate,
        String label,
        long customers,
        long orders,
        BigDecimal revenue
) {
}
