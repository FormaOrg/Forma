import { Component, computed, signal } from '@angular/core';

type BillingMode = 'monthly' | 'yearly';

type Plan = {
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  cta: string;
  popular?: boolean;
};

@Component({
  selector: 'app-pricing-main-section',
  imports: [],
  templateUrl: './main-section.html',
  styleUrl: './main-section.css',
})
export class MainSection {
  readonly billingMode = signal<BillingMode>('yearly');

  readonly plans = signal<Plan[]>([
    {
      name: 'Starter',
      description: 'Perfect for individuals and small projects',
      monthlyPrice: 29,
      yearlyPrice: 23,
      cta: 'Get Started',
      features: [
        'Up to 5 projects',
        '10GB storage',
        'Basic analytics',
        'Email support',
        'Core integrations',
        'Mobile app access',
      ],
    },
    {
      name: 'Pro',
      description: 'Best for growing teams and businesses',
      monthlyPrice: 59,
      yearlyPrice: 47,
      cta: 'Get Started',
      popular: true,
      features: [
        'Unlimited projects',
        '100GB storage',
        'Advanced analytics',
        'Priority support',
        'All integrations',
        'Custom domains',
        'Team collaboration',
        'API access',
      ],
    },
    {
      name: 'Business',
      description: 'Perfect for teams that need more power',
      monthlyPrice: 99,
      yearlyPrice: 79,
      cta: 'Get Started',
      features: [
        'Everything in Pro',
        'Unlimited storage',
        'Enterprise analytics',
        '24/7 phone support',
        'Advanced security',
        'Custom contracts',
        'Dedicated manager',
        'SLA guarantee',
      ],
    },
  ]);

  readonly savePercent = computed(() => 20);

  setBillingMode(mode: BillingMode): void {
    this.billingMode.set(mode);
  }

  getDisplayedPrice(plan: Plan): number {
    return this.billingMode() === 'monthly'
      ? plan.monthlyPrice
      : plan.yearlyPrice;
  }
}