package tn.forma.users.dto;

import lombok.Builder;

import java.util.List;

@Builder
public record ProjectAnalyticsChartPointDto(
        String isoDate,
        String label,
        List<ProjectAnalyticsMetricValueDto> metrics
) {
}
