package tn.forma.users.dto;

import lombok.Builder;

@Builder
public record ProjectAnalyticsMetricOptionDto(
        String key,
        String label,
        ProjectAnalyticsMetricFormat format
) {
}
