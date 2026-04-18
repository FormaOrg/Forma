import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

import { PublicStorefrontRouteService, StorefrontRouteMode } from '../../../core/services/public-storefront-route.service';

@Component({
  selector: 'app-storefront-checkout-success',
  standalone: true,
  imports: [CommonModule, RouterLink],
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
    this.storefrontRouteService.buildPath(this.projectId(), this.routeMode())
  );
  readonly productsPath = computed(() =>
    this.storefrontRouteService.buildPath(this.projectId(), this.routeMode(), 'products')
  );
  readonly orderNumber = computed(() => this.queryParamMap()?.get('orderNumber') ?? 'Pending confirmation');
  readonly total = computed(() => Number(this.queryParamMap()?.get('total') ?? '0'));
  readonly currency = computed(() => this.queryParamMap()?.get('currency') ?? 'TND');
}
