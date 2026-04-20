import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

import { PublicStorefrontRouteService, StorefrontRouteMode } from '../../../core/services/public-storefront-route.service';

@Component({
  selector: 'app-storefront-checkout-success',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './storefront-checkout-success.html',
  styleUrl: './storefront-checkout-success.css',
})
export class StorefrontCheckoutSuccess {
  private readonly route = inject(ActivatedRoute);
  private readonly storefrontRouteService = inject(PublicStorefrontRouteService);

  readonly projectParamMap = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });
  readonly queryParamMap = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  readonly projectIdParam = computed(() => this.projectParamMap()?.get('projectId'));
  readonly routeMode = computed<StorefrontRouteMode>(() => this.storefrontRouteService.resolveRouteMode(this.projectIdParam()));
  readonly projectId = computed(() => this.storefrontRouteService.resolveProjectId(this.projectIdParam()));
  readonly isEditorPreview = computed(() => this.queryParamMap()?.get('preview') === 'editor');
  readonly homePath = computed(() =>
    this.storefrontRouteService.buildUrl(
      this.projectId(),
      this.routeMode(),
      '',
      this.isEditorPreview() ? { preview: 'editor' } : undefined
    )
  );
  readonly productsPath = computed(() =>
    this.storefrontRouteService.buildUrl(
      this.projectId(),
      this.routeMode(),
      'products',
      this.isEditorPreview() ? { preview: 'editor' } : undefined
    )
  );
  readonly orderNumber = computed(() => this.queryParamMap()?.get('orderNumber') ?? 'Pending confirmation');
  readonly total = computed(() => Number(this.queryParamMap()?.get('total') ?? '0'));
  readonly currency = computed(() => this.queryParamMap()?.get('currency') ?? 'TND');
}
