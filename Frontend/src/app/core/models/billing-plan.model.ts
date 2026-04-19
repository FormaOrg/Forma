export type BillingPlanCode = 'STARTER' | 'PRO' | 'BUSINESS';

export type BillingPlanDefinition = {
  code: BillingPlanCode;
  label: 'Starter' | 'Pro' | 'Business';
  summary: string;
  monthlyPriceLabel: string;
  features: string[];
};

export const BILLING_PLANS: BillingPlanDefinition[] = [
  {
    code: 'STARTER',
    label: 'Starter',
    summary: 'Basic storefront editing, limited projects',
    monthlyPriceLabel: '$0/mo',
    features: [
      'Basic storefront editing',
      'Up to 5 projects',
      '1 published storefront',
      'Email support',
    ],
  },
  {
    code: 'PRO',
    label: 'Pro',
    summary: 'Unlimited projects, real-time collaboration',
    monthlyPriceLabel: '$19/mo',
    features: [
      'Unlimited projects',
      'Real-time collaboration',
      'Advanced publishing controls',
      'Priority email support',
    ],
  },
  {
    code: 'BUSINESS',
    label: 'Business',
    summary: 'Everything in Pro + priority support',
    monthlyPriceLabel: '$49/mo',
    features: [
      'Everything in Pro',
      'Priority support',
      'Expanded team access',
      'Business-ready billing visibility',
    ],
  },
];

export function isBillingPlanCode(value: string | null | undefined): value is BillingPlanCode {
  return value === 'STARTER' || value === 'PRO' || value === 'BUSINESS';
}

export function toBillingPlanCode(planName: string | null | undefined): BillingPlanCode {
  const normalized = (planName ?? '').trim().toUpperCase();

  if (normalized === 'STARTER' || normalized === 'PRO' || normalized === 'BUSINESS') {
    return normalized;
  }

  return 'STARTER';
}

export function toBillingPlanLabel(planCode: BillingPlanCode): BillingPlanDefinition['label'] {
  return BILLING_PLANS.find((plan) => plan.code === planCode)?.label ?? 'Starter';
}

export function getBillingPlan(planCode: BillingPlanCode): BillingPlanDefinition {
  return BILLING_PLANS.find((plan) => plan.code === planCode) ?? BILLING_PLANS[0];
}

export function getDefaultUpgradeTarget(currentPlan: BillingPlanCode): BillingPlanCode {
  if (currentPlan === 'STARTER') {
    return 'PRO';
  }

  if (currentPlan === 'PRO') {
    return 'BUSINESS';
  }

  return 'BUSINESS';
}
