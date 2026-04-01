import { BillingMode } from '../../features/pricing/pricing-plans';

export type DashboardProjectStatus = 'published' | 'draft' | 'archived';

export interface DashboardProjectItem {
  id: string;
  backendId: number;
  name: string;
  description: string;
  status: DashboardProjectStatus;
  statusLabel: string;
  domain?: string;
  liveUrl?: string;
  previewUrl?: string;
  thumbnailUrl?: string;
  accent: string;
  route?: string;
  previewRoute?: string;
  metadata?: string;
  lastEditedLabel: string;
  createdLabel: string;
  updatedDateLabel: string;
  createdDateLabel: string;
  typeLabel: string;
  creationMethodLabel: string;
  lastEditedAt: number;
  createdAt: number;
}

export interface BillingUsageMetric {
  label: string;
  used: number;
  limit?: number | null;
  unit: string;
  note: string;
}

export interface BillingInvoiceItem {
  id: string;
  dateLabel: string;
  amountLabel: string;
  statusLabel: string;
  downloadUrl?: string;
}

export interface BillingPaymentMethodSummary {
  brand?: string;
  last4?: string;
  expiryLabel?: string;
  contactEmail?: string;
  summary: string;
}

export interface BillingSubscriptionSummary {
  planName?: string;
  planDescription?: string;
  status: 'active' | 'trial' | 'canceled' | 'past-due' | 'inactive';
  billingMode: BillingMode;
  billingCycleLabel?: string;
  renewalDateLabel?: string;
  nextChargeLabel?: string;
  promoNotice?: string;
}

export interface BillingOverview {
  subscription: BillingSubscriptionSummary;
  usage: BillingUsageMetric[];
  paymentMethod: BillingPaymentMethodSummary | null;
  invoices: BillingInvoiceItem[];
  activeProjectsCount: number;
  paidInvoicesCount: number;
  currentSpendLabel: string;
}
