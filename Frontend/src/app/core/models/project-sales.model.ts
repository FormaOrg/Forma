export type SalesRangePreset = 'THIS_WEEK' | 'THIS_MONTH' | 'LAST_30_DAYS' | 'LAST_90_DAYS';
export type SalesOrderSort = 'PLACED_AT_DESC' | 'PLACED_AT_ASC' | 'TOTAL_DESC' | 'TOTAL_ASC';
export type SalesOrderFilter = 'ALL' | 'ACTIVE' | 'DELIVERED' | 'DUE_ON_DELIVERY';
export type SalesPaymentStatus = 'DUE_ON_DELIVERY' | 'COLLECTED' | 'DEPOSIT_RETURNED';
export type SalesFulfillmentStatus = 'NEW' | 'PACKING' | 'SCHEDULED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';

export interface ProjectSalesSummary {
  revenue: number;
  revenueChangePercent: number;
  orders: number;
  ordersChangePercent: number;
  averageOrderValue: number;
  averageOrderValueChangePercent: number;
  awaitingDelivery: number;
  awaitingDeliveryChange: number;
  delivered: number;
  deliveredChangePercent: number;
  averageDeliveryDays: number;
  averageDeliveryDaysChange: number;
}

export interface ProjectSalesChartPoint {
  isoDate: string;
  label: string;
  revenue: number;
  orders: number;
}

export interface ProjectSalesDeliveryStat {
  label: string;
  value: number;
  note: string;
}

export interface ProjectSalesTopProduct {
  productId: number | null;
  name: string;
  sku: string | null;
  revenue: number;
  units: number;
  growthPercent: number;
}

export interface ProjectSalesOrderRow {
  id: number;
  orderNumber: string;
  customerName: string;
  placedAt: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  total: number;
}

export interface ProjectSalesOrderEditorItem {
  id: number | null;
  productId: number | null;
  productName: string;
  productSku: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface ProjectSalesOrderEditor {
  id: number;
  customerId: number | null;
  customerName: string;
  orderNumber: string;
  placedAt: string;
  scheduledFor: string | null;
  deliveredAt: string | null;
  paymentStatus: SalesPaymentStatus;
  fulfillmentStatus: SalesFulfillmentStatus;
  subtotal: number;
  deliveryFee: number;
  total: number;
  deliveryAddress: string | null;
  notes: string | null;
  items: ProjectSalesOrderEditorItem[];
}

export interface ProjectSalesOrderItemInput {
  productId?: number | null;
  productName?: string | null;
  productSku?: string | null;
  quantity: number;
  unitPrice: number;
}

export interface CreateProjectOrderRequest {
  customerId?: number | null;
  orderNumber: string;
  placedAt: string;
  scheduledFor?: string | null;
  deliveredAt?: string | null;
  paymentStatus: SalesPaymentStatus;
  fulfillmentStatus: SalesFulfillmentStatus;
  deliveryFee: number;
  deliveryAddress?: string | null;
  notes?: string | null;
  items: ProjectSalesOrderItemInput[];
}

export type UpdateProjectOrderRequest = CreateProjectOrderRequest;

export interface ProjectSalesOrdersPage {
  items: ProjectSalesOrderRow[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  search: string;
  sort: SalesOrderSort;
  filter: SalesOrderFilter;
}

export interface ProjectSalesPageResponse {
  currencyCode: string;
  rangePreset: SalesRangePreset;
  rangeStart: string;
  rangeEndExclusive: string;
  compareEnabled: boolean;
  comparisonRangeStart: string | null;
  comparisonRangeEndExclusive: string | null;
  summary: ProjectSalesSummary;
  chartPoints: ProjectSalesChartPoint[];
  deliveryStats: ProjectSalesDeliveryStat[];
  topProducts: ProjectSalesTopProduct[];
  orders: ProjectSalesOrdersPage;
  hasData: boolean;
}

export interface ProjectSalesQuery {
  range: SalesRangePreset;
  compare: boolean;
  search?: string;
  sort: SalesOrderSort;
  filter: SalesOrderFilter;
  page: number;
  size: number;
}
