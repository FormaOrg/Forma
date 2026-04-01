import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { BillingInvoiceItem, BillingOverview, BillingUsageMetric } from '../../../../../core/models/dashboard.model';
import { DashboardDataService } from '../../../../../core/services/dashboard-data.service';
import { DataCard } from '../home/components/data-card/data-card';
import {
  BillingMode,
  PRICING_PLANS,
  PRICING_SAVE_PERCENT,
  PricingPlan,
  getPlanPrice,
} from '../../../../pricing/pricing-plans';

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [CommonModule, RouterLink, DataCard],
  templateUrl: './billing.live.html',
  styleUrl: './billing.css',
})
export class Billing implements OnInit {
  private readonly dashboardDataService = inject(DashboardDataService);

  readonly billingMode = signal<BillingMode>('yearly');
  readonly currentPlanName = signal<string | null>(null);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');
  readonly overview = signal<BillingOverview | null>(null);

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

  readonly currentSubscription = computed(
    () =>
      this.overview()?.subscription ?? {
        status: 'inactive' as const,
        billingMode: this.billingMode(),
      }
  );
  readonly usage = computed(() => this.overview()?.usage ?? []);
  readonly invoices = computed(() => this.overview()?.invoices ?? []);
  readonly paymentMethod = computed(() => this.overview()?.paymentMethod ?? null);

  readonly currentPlan = computed(
    () => this.plans().find((plan) => plan.name === this.currentPlanName()) ?? null
  );

  readonly currentPlanPrice = computed(() => {
    const plan = this.currentPlan();
    return plan ? getPlanPrice(plan, this.billingMode()) : 0;
  });
  readonly yearlySummary = computed(() =>
    this.currentPlan()
      ? this.billingMode() === 'yearly'
        ? `${this.currentPlanPrice() * 12} DT billed yearly`
        : 'Switch to yearly to save'
      : 'No billing summary available yet'
  );

  readonly activeProjects = computed(() => this.overview()?.activeProjectsCount.toString() ?? '0');
  readonly invoicesPaid = computed(() => this.overview()?.paidInvoicesCount.toString() ?? '0');

  ngOnInit(): void {
    this.loadBilling();
  }

  loadBilling(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.dashboardDataService
      .getBillingOverview()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (overview) => {
          this.overview.set(overview);
          this.currentPlanName.set(overview.subscription.planName ?? null);
          this.billingMode.set(overview.subscription.billingMode);
        },
        error: (error) => {
          this.errorMessage.set(error?.error?.message ?? 'We could not load your billing details right now.');
          this.overview.set(null);
          this.currentPlanName.set(null);
        },
      });
  }

  setBillingMode(mode: BillingMode): void {
    this.billingMode.set(mode);
  }

  usagePercent(metric: BillingUsageMetric): number {
    if (!metric.limit || metric.limit <= 0) return 0;
    return Math.min(100, Math.round((metric.used / metric.limit) * 100));
  }

  isCurrentPlan(plan: PricingPlan): boolean {
    return plan.name === this.currentPlanName();
  }

  planActionLabel(plan: PricingPlan): string {
    const currentPlan = this.currentPlan();
    if (this.isCurrentPlan(plan)) return 'Current Plan';
    if (!currentPlan) return 'Choose Plan';
    if (plan.monthlyPrice > currentPlan.monthlyPrice) return 'Upgrade';
    return 'Downgrade';
  }

  statusLabel(status: 'active' | 'trial' | 'canceled' | 'past-due' | 'inactive'): string {
    if (status === 'past-due') return 'Past due';
    if (status === 'trial') return 'Trial';
    if (status === 'canceled') return 'Canceled';
    if (status === 'inactive') return 'No active plan';
    return 'Active';
  }

  getDisplayedPlanPrice(plan: PricingPlan): number {
    return getPlanPrice(plan, this.billingMode());
  }

  trackByPlan = (_: number, plan: PricingPlan): string => plan.name;
  trackByUsage = (_: number, item: BillingUsageMetric): string => item.label;
  trackByInvoice = (_: number, invoice: BillingInvoiceItem): string => invoice.id;
}
