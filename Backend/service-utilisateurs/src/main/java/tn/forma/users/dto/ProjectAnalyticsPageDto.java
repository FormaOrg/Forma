package tn.forma.users.dto;

import lombok.Builder;

import java.util.List;

@Builder
public record ProjectAnalyticsPageDto(
        ProjectAnalyticsKind kind,
        AnalyticsRangePreset rangePreset,
        String rangeStart,
        String rangeEndExclusive,
        List<ProjectAnalyticsSummaryCardDto> summaryCards,
        List<ProjectAnalyticsMetricOptionDto> metricOptions,
        ProjectAnalyticsSectionHeadingDto chartHeading,
        List<ProjectAnalyticsChartPointDto> chartPoints,
        ProjectAnalyticsSectionHeadingDto breakdownHeading,
        List<ProjectAnalyticsBreakdownItemDto> breakdownItems,
        ProjectAnalyticsSectionHeadingDto primaryListHeading,
        List<ProjectAnalyticsRankItemDto> primaryListItems,
        ProjectAnalyticsSectionHeadingDto secondaryListHeading,
        List<ProjectAnalyticsRankItemDto> secondaryListItems,
        ProjectAnalyticsSectionHeadingDto insightsHeading,
        List<ProjectAnalyticsInsightDto> insights,
        boolean hasData
) {
}
