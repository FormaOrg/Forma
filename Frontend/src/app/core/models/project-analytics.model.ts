export type AnalyticsRangePreset = 'LAST_7_DAYS' | 'LAST_30_DAYS' | 'LAST_90_DAYS';

export type ProjectAnalyticsKind = 'ECOMMERCE' | 'PORTFOLIO';
export type ProjectAnalyticsMetricFormat = 'NUMBER' | 'CURRENCY' | 'PERCENT';

export interface ProjectAnalyticsSummaryCard {
  key: string;
  label: string;
  formattedValue: string;
  changePercent: number;
  tone: string;
  icon: string;
}

export interface ProjectAnalyticsMetricOption {
  key: string;
  label: string;
  format: ProjectAnalyticsMetricFormat;
}

export interface ProjectAnalyticsMetricValue {
  key: string;
  value: number;
}

export interface ProjectAnalyticsChartPoint {
  isoDate: string;
  label: string;
  metrics: ProjectAnalyticsMetricValue[];
}

export interface ProjectAnalyticsSectionHeading {
  kicker: string;
  title: string;
}

export interface ProjectAnalyticsBreakdownItem {
  label: string;
  value: number;
  percentage: number;
  note: string;
}

export interface ProjectAnalyticsRankItem {
  title: string;
  subtitle: string;
  value: string;
  meta: string;
}

export interface ProjectAnalyticsInsight {
  title: string;
  body: string;
}

export interface ProjectAnalyticsPageResponse {
  kind: ProjectAnalyticsKind;
  rangePreset: AnalyticsRangePreset;
  rangeStart: string;
  rangeEndExclusive: string;
  summaryCards: ProjectAnalyticsSummaryCard[];
  metricOptions: ProjectAnalyticsMetricOption[];
  chartHeading: ProjectAnalyticsSectionHeading;
  chartPoints: ProjectAnalyticsChartPoint[];
  breakdownHeading: ProjectAnalyticsSectionHeading;
  breakdownItems: ProjectAnalyticsBreakdownItem[];
  primaryListHeading: ProjectAnalyticsSectionHeading;
  primaryListItems: ProjectAnalyticsRankItem[];
  secondaryListHeading: ProjectAnalyticsSectionHeading;
  secondaryListItems: ProjectAnalyticsRankItem[];
  insightsHeading: ProjectAnalyticsSectionHeading;
  insights: ProjectAnalyticsInsight[];
  hasData: boolean;
}
