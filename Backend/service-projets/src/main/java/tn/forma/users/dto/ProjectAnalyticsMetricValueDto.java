package tn.forma.users.dto;

import lombok.Builder;

@Builder
public record ProjectAnalyticsMetricValueDto(
        String key,
        double value
) {
}
