package tn.forma.users.dto;

import lombok.Builder;

import java.util.List;

@Builder
public record ProjectAnalyticsPageDto(
        AnalyticsRangePreset rangePreset,
        String rangeStart,
        String rangeEndExclusive,
        ProjectAnalyticsSummaryDto summary,
        List<ProjectAnalyticsChartPointDto> chartPoints,
        List<ProjectAnalyticsBreakdownItemDto> zoneBreakdown,
        List<ProjectAnalyticsTopCustomerDto> topCustomers,
        List<ProjectSalesTopProductDto> topProducts,
        List<ProjectAnalyticsInsightDto> insights,
        boolean hasData
) {
}
