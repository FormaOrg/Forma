export type AnalyticsRangePreset = 'LAST_7_DAYS' | 'LAST_30_DAYS' | 'LAST_90_DAYS';

export interface ProjectAnalyticsSummary {
  customers: number;
  customersChangePercent: number;
  orders: number;
  ordersChangePercent: number;
  revenue: number;
  revenueChangePercent: number;
  averageOrderValue: number;
  averageOrderValueChangePercent: number;
}

export interface ProjectAnalyticsChartPoint {
  isoDate: string;
  label: string;
  customers: number;
  orders: number;
  revenue: number;
}

export interface ProjectAnalyticsBreakdownItem {
  label: string;
  value: number;
  percentage: number;
  note: string;
}

export interface ProjectAnalyticsTopCustomer {
  customerId: number | null;
  name: string;
  zoneLabel: string;
  orders: number;
  revenue: number;
  growthPercent: number;
}

export interface ProjectAnalyticsTopProduct {
  productId: number | null;
  name: string;
  sku: string | null;
  revenue: number;
  units: number;
  growthPercent: number;
}

export interface ProjectAnalyticsInsight {
  title: string;
  body: string;
}

export interface ProjectAnalyticsPageResponse {
  rangePreset: AnalyticsRangePreset;
  rangeStart: string;
  rangeEndExclusive: string;
  summary: ProjectAnalyticsSummary;
  chartPoints: ProjectAnalyticsChartPoint[];
  zoneBreakdown: ProjectAnalyticsBreakdownItem[];
  topCustomers: ProjectAnalyticsTopCustomer[];
  topProducts: ProjectAnalyticsTopProduct[];
  insights: ProjectAnalyticsInsight[];
  hasData: boolean;
}
