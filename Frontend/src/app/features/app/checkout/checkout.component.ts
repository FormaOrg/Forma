import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs/operators';

import {
  BILLING_PLANS,
  BillingPlanCode,
  isBillingPlanCode,
  toBillingPlanCode,
  toBillingPlanLabel,
} from '../../../core/models/billing-plan.model';
import { DashboardDataService } from '../../../core/services/dashboard-data.service';
import { PlanSyncService } from '../../../core/services/plan-sync.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css',
})
export class CheckoutComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dashboardDataService = inject(DashboardDataService);
  private readonly planSyncService = inject(PlanSyncService);

  readonly plans = BILLING_PLANS;
  readonly selectedPlan = signal<BillingPlanCode>('PRO');
  readonly currentPlan = signal<BillingPlanCode>('STARTER');
  readonly isBootstrapping = signal(true);
  readonly isSubmitting = signal(false);
  readonly isSuccess = signal(false);
  readonly errorMessage = signal('');

  readonly cardholderName = signal('');
  readonly cardNumber = signal('');
  readonly expiry = signal('');
  readonly cvc = signal('');

  readonly currentPlanLabel = computed(() => toBillingPlanLabel(this.currentPlan()));
  readonly successLabel = computed(() => toBillingPlanLabel(this.selectedPlan()));
  readonly isCurrentPlanSelected = computed(() => this.selectedPlan() === this.currentPlan());

  constructor() {
    this.route.queryParamMap.subscribe((params) => {
      const requestedPlan = params.get('plan');
      if (isBillingPlanCode(requestedPlan)) {
        this.selectedPlan.set(requestedPlan);
      }
    });

    this.dashboardDataService
      .getBillingOverview({ useCache: false })
      .pipe(finalize(() => this.isBootstrapping.set(false)))
      .subscribe({
        next: (overview) => {
          const currentPlanCode = toBillingPlanCode(overview.subscription.planName);
          this.currentPlan.set(currentPlanCode);

          const requestedPlan = this.route.snapshot.queryParamMap.get('plan');
          if (!isBillingPlanCode(requestedPlan)) {
            this.selectedPlan.set(currentPlanCode);
          }
        },
        error: () => {
          this.currentPlan.set('STARTER');
        },
      });
  }

  selectPlan(plan: BillingPlanCode): void {
    this.selectedPlan.set(plan);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { plan },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  submitUpgrade(): void {
    if (this.isSubmitting() || this.isCurrentPlanSelected()) {
      return;
    }

    this.errorMessage.set('');
    this.isSubmitting.set(true);

    window.setTimeout(() => {
      this.dashboardDataService.updateSubscriptionPlan(this.selectedPlan()).subscribe({
        next: () => {
          this.planSyncService.emitPlanUpdated(this.selectedPlan());
          this.isSubmitting.set(false);
          this.isSuccess.set(true);

          window.setTimeout(() => {
            window.close();
          }, 2000);
        },
        error: (error: HttpErrorResponse) => {
          this.isSubmitting.set(false);
          this.errorMessage.set(this.readErrorMessage(error));
        },
      });
    }, 1500);
  }

  @HostListener('window:keydown.escape')
  closeOnEscape(): void {
    if (!this.isSubmitting()) {
      window.close();
    }
  }

  private readErrorMessage(error: HttpErrorResponse): string {
    const backendMessage =
      typeof error.error?.message === 'string' && error.error.message.trim().length > 0
        ? error.error.message.trim()
        : null;

    return backendMessage ?? 'We could not update your plan. Please try again.';
  }
}
