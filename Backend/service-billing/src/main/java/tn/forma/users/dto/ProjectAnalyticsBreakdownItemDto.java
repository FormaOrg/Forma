package tn.forma.users.dto;

import lombok.Builder;

@Builder
public record ProjectAnalyticsBreakdownItemDto(
        String label,
        long value,
        double percentage,
        String note
) {
}
