export type BillingMode = 'monthly' | 'yearly';

export type PricingPlan = {
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  cta: string;
  popular?: boolean;
};

export const DEFAULT_BILLING_MODE: BillingMode = 'yearly';
export const PRICING_SAVE_PERCENT = 20;

export const PRICING_PLANS: PricingPlan[] = [
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
];

export function getPlanPrice(plan: PricingPlan, billingMode: BillingMode): number {
  return billingMode === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
}
