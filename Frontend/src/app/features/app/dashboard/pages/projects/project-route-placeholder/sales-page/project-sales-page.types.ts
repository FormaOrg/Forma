export interface SalesOption<T extends string> {
  label: string;
  value: T;
}

export interface SalesKpiCard {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  helper: string;
}

export interface SalesTrendPoint {
  label: string;
  revenue: number;
  orders: number;
}

export interface SalesDeliveryStatView {
  label: string;
  value: string;
  note: string;
}

export interface SalesTopProductView {
  name: string;
  sku: string;
  revenue: string;
  units: number;
  trend: string;
}

export interface SalesFocusItem {
  step: string;
  title: string;
  body: string;
}

export interface SalesOrderView {
  rawId: number;
  id: string;
  customer: string;
  date: string;
  amount: string;
  paymentStatus: string;
  fulfillmentStatus: string;
}

export interface SalesOrderSelectionChange {
  orderId: number;
  selected: boolean;
}
