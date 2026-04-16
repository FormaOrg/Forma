package tn.forma.users.dto;

import lombok.Builder;

@Builder
public record ProjectAnalyticsSummaryCardDto(
        String key,
        String label,
        String formattedValue,
        double changePercent,
        String tone,
        String icon
) {
}
