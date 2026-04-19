import { Injectable } from '@angular/core';

import { BillingPlanCode, isBillingPlanCode } from '../models/billing-plan.model';

type PlanSyncPayload = {
  plan: BillingPlanCode;
  updatedAt: number;
};

@Injectable({ providedIn: 'root' })
export class PlanSyncService {
  private readonly storageKey = 'forma_plan_updated';

  emitPlanUpdated(plan: BillingPlanCode): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    const payload: PlanSyncPayload = {
      plan,
      updatedAt: Date.now(),
    };

    localStorage.setItem(this.storageKey, JSON.stringify(payload));
  }

  readPlanUpdatedEvent(event: StorageEvent): BillingPlanCode | null {
    if (event.key !== this.storageKey || !event.newValue) {
      return null;
    }

    try {
      const payload = JSON.parse(event.newValue) as Partial<PlanSyncPayload>;
      return isBillingPlanCode(payload.plan) ? payload.plan : null;
    } catch {
      return null;
    }
  }
}
