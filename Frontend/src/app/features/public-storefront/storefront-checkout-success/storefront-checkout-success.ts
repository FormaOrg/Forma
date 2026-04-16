import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-storefront-checkout-success',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './storefront-checkout-success.html',
  styleUrl: './storefront-checkout-success.css',
})
export class StorefrontCheckoutSuccess {
  private readonly route = inject(ActivatedRoute);

  readonly projectParamMap = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });
  readonly queryParamMap = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  readonly projectId = computed(() => {
    const projectId = Number(this.projectParamMap()?.get('projectId') ?? '0');
    return Number.isFinite(projectId) && projectId > 0 ? projectId : 0;
  });
  readonly orderNumber = computed(() => this.queryParamMap()?.get('orderNumber') ?? 'Pending confirmation');
  readonly total = computed(() => Number(this.queryParamMap()?.get('total') ?? '0'));
  readonly currency = computed(() => this.queryParamMap()?.get('currency') ?? 'TND');
}
