import { Component, computed, signal } from '@angular/core';
import {
  BillingMode,
  DEFAULT_BILLING_MODE,
  PRICING_PLANS,
  PRICING_SAVE_PERCENT,
  PricingPlan,
  getPlanPrice,
} from '../../pricing-plans';

@Component({
  selector: 'app-pricing-main-section',
  imports: [],
  templateUrl: './main-section.html',
  styleUrl: './main-section.css',
})
export class MainSection {
  readonly billingMode = signal<BillingMode>(DEFAULT_BILLING_MODE);
  readonly plans = signal<PricingPlan[]>(PRICING_PLANS);
  readonly savePercent = computed(() => PRICING_SAVE_PERCENT);

  setBillingMode(mode: BillingMode): void {
    this.billingMode.set(mode);
  }

  getDisplayedPrice(plan: PricingPlan): number {
    return getPlanPrice(plan, this.billingMode());
  }
}
