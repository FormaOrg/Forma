import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DataCard } from '../home/components/data-card/data-card';
import {
  BillingMode,
  PRICING_PLANS,
  PRICING_SAVE_PERCENT,
  PricingPlan,
  getPlanPrice,
} from '../../../../pricing/pricing-plans';

type SubscriptionStatus = 'active' | 'trial' | 'canceled' | 'past-due';

type UsageMetric = {
  label: string;
  used: number;
  limit: number;
  unit: string;
  note: string;
};

type Invoice = {
  id: string;
  date: string;
  amount: string;
  status: 'Paid' | 'Pending' | 'Refunded';
};

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [CommonModule, RouterLink, DataCard],
  templateUrl: './billing.html',
  styleUrl: './billing.css',
})
export class Billing {
  readonly billingMode = signal<BillingMode>('yearly');
  readonly currentPlanName = signal('Pro');

  readonly walletIcon = `
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 8.5C4 7.67157 4.67157 7 5.5 7H18.5C19.3284 7 20 7.67157 20 8.5V17.5C20 18.3284 19.3284 19 18.5 19H5.5C4.67157 19 4 18.3284 4 17.5V8.5Z" stroke="currentColor" stroke-width="1.8"/>
    <path d="M16 13H20" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M6 7V6.5C6 5.67157 6.67157 5 7.5 5H17" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
  </svg>
  `;

  readonly receiptIcon = `
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7 3H17V21L14 19L12 21L10 19L7 21V3Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M10 8H14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M10 12H14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
  </svg>
  `;

  readonly shieldIcon = `
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 3L19 6V11C19 15.4183 16.3137 19.4016 12 21C7.68629 19.4016 5 15.4183 5 11V6L12 3Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M9.5 12L11.2 13.7L14.8 10.1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
  `;

  readonly plans = signal<PricingPlan[]>(PRICING_PLANS);
  readonly savePercent = PRICING_SAVE_PERCENT;

  readonly currentSubscription = signal({
    planName: 'Pro',
    status: 'active' as SubscriptionStatus,
    billingCycleLabel: 'Yearly billing',
    renewalDate: 'April 24, 2026',
    nextCharge: '564 DT',
    contactEmail: 'billing@portfolio-studio.com',
    promoNotice: 'You are saving 20% with annual billing and your onboarding discount is locked until renewal.',
  });

  readonly usage = signal<UsageMetric[]>([
    { label: 'Projects', used: 4, limit: 999, unit: 'sites', note: 'Unlimited project slots on Pro' },
    { label: 'Custom domains', used: 3, limit: 10, unit: 'domains', note: '7 domains still available before your next review' },
    { label: 'Storage', used: 62, limit: 100, unit: 'GB', note: 'You are approaching your included storage allowance' },
    { label: 'Collaborators', used: 5, limit: 8, unit: 'members', note: 'Invite up to 3 more teammates on the current plan' },
  ]);

  readonly invoices = signal<Invoice[]>([
    { id: 'INV-2404', date: 'Mar 24, 2026', amount: '564 DT', status: 'Paid' },
    { id: 'INV-2312', date: 'Feb 24, 2026', amount: '564 DT', status: 'Paid' },
    { id: 'INV-2258', date: 'Jan 24, 2026', amount: '564 DT', status: 'Paid' },
    { id: 'INV-2196', date: 'Dec 24, 2025', amount: '564 DT', status: 'Paid' },
  ]);

  readonly currentPlan = computed(
    () => this.plans().find((plan) => plan.name === this.currentPlanName()) ?? this.plans()[0]
  );

  readonly currentPlanPrice = computed(() => getPlanPrice(this.currentPlan(), this.billingMode()));
  readonly yearlySummary = computed(() =>
    this.billingMode() === 'yearly' ? `${this.currentPlanPrice() * 12} DT billed yearly` : 'Switch to yearly to save'
  );

  readonly activeProjects = computed(() => this.usage()[0]?.used.toString() ?? '0');
  readonly invoicesPaid = computed(() => this.invoices().filter((invoice) => invoice.status === 'Paid').length.toString());

  setBillingMode(mode: BillingMode): void {
    this.billingMode.set(mode);
  }

  usagePercent(metric: UsageMetric): number {
    if (metric.limit <= 0) return 0;
    return Math.min(100, Math.round((metric.used / metric.limit) * 100));
  }

  isCurrentPlan(plan: PricingPlan): boolean {
    return plan.name === this.currentPlanName();
  }

  planActionLabel(plan: PricingPlan): string {
    if (this.isCurrentPlan(plan)) return 'Current Plan';
    if (plan.monthlyPrice > this.currentPlan().monthlyPrice) return 'Upgrade';
    return 'Downgrade';
  }

  statusLabel(status: SubscriptionStatus): string {
    if (status === 'past-due') return 'Past due';
    if (status === 'trial') return 'Trial';
    if (status === 'canceled') return 'Canceled';
    return 'Active';
  }

  getDisplayedPlanPrice(plan: PricingPlan): number {
    return getPlanPrice(plan, this.billingMode());
  }

  trackByPlan = (_: number, plan: PricingPlan): string => plan.name;
  trackByUsage = (_: number, item: UsageMetric): string => item.label;
  trackByInvoice = (_: number, invoice: Invoice): string => invoice.id;
}
