import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { BillingInvoiceItem, BillingOverview, BillingUsageMetric } from '../../../../../core/models/dashboard.model';
import { DashboardDataService } from '../../../../../core/services/dashboard-data.service';
import { I18nService } from '../../../../landing-page/i18n/i18n.service';
import { TranslatePipe } from '../../../../landing-page/i18n/translate.pipe';
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
  imports: [CommonModule, RouterLink, DataCard, TranslatePipe],
  templateUrl: './billing.polished.html',
})
export class Billing implements OnInit {
  private readonly dashboardDataService = inject(DashboardDataService);
  private readonly i18n = inject(I18nService);
  private readonly maxVisibleInvoices = 4;

  readonly billingMode = signal<BillingMode>('yearly');
  readonly currentPlanName = signal<string | null>(null);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');
  readonly overview = signal<BillingOverview | null>(null);
  readonly showInvoicesModal = signal(false);

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
  readonly visibleInvoices = computed(() => this.invoices().slice(0, this.maxVisibleInvoices));
  readonly hasHiddenInvoices = computed(() => this.invoices().length > this.maxVisibleInvoices);
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
        ? `${this.currentPlanPrice() * 12} DT ${this.i18n.t('dashboard.billing.yearlySummary.billedYearly')}`
        : this.i18n.t('dashboard.billing.yearlySummary.switch')
      : this.i18n.t('dashboard.billing.yearlySummary.none')
  );

  readonly activeProjects = computed(() => this.overview()?.activeProjectsCount.toString() ?? '0');
  readonly invoicesPaid = computed(() => this.overview()?.paidInvoicesCount.toString() ?? '0');

  ngOnInit(): void {
    this.loadBilling();
  }

  loadBilling(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.showInvoicesModal.set(false);

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
          this.errorMessage.set(this.toBillingErrorMessage(error));
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
    if (this.isCurrentPlan(plan)) return this.i18n.t('dashboard.billing.plan.current');
    if (!currentPlan) return this.i18n.t('dashboard.billing.plan.choose');
    if (plan.monthlyPrice > currentPlan.monthlyPrice) return this.i18n.t('dashboard.billing.plan.upgrade');
    return this.i18n.t('dashboard.billing.plan.downgrade');
  }

  statusLabel(status: 'active' | 'trial' | 'canceled' | 'past-due' | 'inactive'): string {
    if (status === 'past-due') return this.i18n.t('dashboard.billing.status.pastDue');
    if (status === 'trial') return this.i18n.t('dashboard.billing.status.trial');
    if (status === 'canceled') return this.i18n.t('dashboard.billing.status.canceled');
    if (status === 'inactive') return this.i18n.t('dashboard.billing.status.inactive');
    return this.i18n.t('dashboard.billing.status.active');
  }

  getDisplayedPlanPrice(plan: PricingPlan): number {
    return getPlanPrice(plan, this.billingMode());
  }

  openInvoicesModal(): void {
    this.showInvoicesModal.set(true);
  }

  closeInvoicesModal(): void {
    this.showInvoicesModal.set(false);
  }

  downloadInvoice(invoice: BillingInvoiceItem): void {
    if (invoice.downloadUrl) {
      window.open(invoice.downloadUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    const subscription = this.currentSubscription();
    const paymentMethod = this.paymentMethod();
    const pdfBytes = this.buildInvoicePdf([
      `FORMA INVOICE`,
      ``,
      `Invoice: ${invoice.id}`,
      `Date: ${invoice.dateLabel}`,
      `Status: ${invoice.statusLabel}`,
      ``,
      `Plan: ${subscription.planName ?? 'No active plan'}`,
      `Billing cycle: ${subscription.billingCycleLabel ?? 'Billing cycle unavailable'}`,
      `Renewal: ${subscription.renewalDateLabel ?? 'Not scheduled'}`,
      ``,
      `Billing contact: ${paymentMethod?.contactEmail ?? 'Not available'}`,
      `Payment summary: ${paymentMethod?.summary ?? 'Generated from your Forma billing overview'}`,
      ``,
      `Total charged: ${invoice.amountLabel}`,
      ``,
      `Generated from your Forma dashboard billing data for preview and testing.`,
    ]);

    const pdfBuffer = new ArrayBuffer(pdfBytes.byteLength);
    new Uint8Array(pdfBuffer).set(pdfBytes);
    const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = `${this.toFileSafeName(invoice.id)}.pdf`;
    anchor.click();
    URL.revokeObjectURL(objectUrl);
  }

  private toBillingErrorMessage(error: unknown): string {
    const status = this.readErrorStatus(error);

    if (status === 0) {
      return this.i18n.t('dashboard.billing.errors.connection');
    }

    return this.i18n.t('dashboard.billing.errors.load');
  }

  private readErrorStatus(error: unknown): number | undefined {
    if (typeof error === 'object' && error && 'status' in error) {
      const value = (error as { status?: unknown }).status;
      return typeof value === 'number' ? value : undefined;
    }

    return undefined;
  }

  private toFileSafeName(value: string): string {
    return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'forma-invoice';
  }

  private buildInvoicePdf(lines: string[]): Uint8Array {
    const objects: string[] = [];
    const escapedLines = lines.map((line) => this.escapePdfText(line));
    const content = [
      'BT',
      '/F1 24 Tf',
      '72 770 Td',
      `(${escapedLines[0]}) Tj`,
      '/F1 12 Tf',
      '0 -34 Td',
      ...escapedLines.slice(1).map((line) => `(${line}) Tj T*`),
      'ET',
    ].join('\n');

    objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj');
    objects.push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj');
    objects.push(
      '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj'
    );
    objects.push('4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj');
    objects.push(`5 0 obj\n<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj`);

    let pdf = '%PDF-1.4\n';
    const offsets: number[] = [0];

    for (const object of objects) {
      offsets.push(pdf.length);
      pdf += `${object}\n`;
    }

    const xrefStart = pdf.length;
    pdf += `xref\n0 ${objects.length + 1}\n`;
    pdf += '0000000000 65535 f \n';
    for (let index = 1; index < offsets.length; index += 1) {
      pdf += `${offsets[index].toString().padStart(10, '0')} 00000 n \n`;
    }
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

    return new TextEncoder().encode(pdf);
  }

  private escapePdfText(value: string): string {
    return value
      .replaceAll('\\', '\\\\')
      .replaceAll('(', '\\(')
      .replaceAll(')', '\\)');
  }

  trackByPlan = (_: number, plan: PricingPlan): string => plan.name;
  trackByUsage = (_: number, item: BillingUsageMetric): string => item.label;
  trackByInvoice = (_: number, invoice: BillingInvoiceItem): string => invoice.id;
}
