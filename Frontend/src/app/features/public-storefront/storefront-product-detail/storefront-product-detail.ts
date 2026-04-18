import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';

import { PublicStorefrontHome, PublicStorefrontProduct } from '../../../core/models/public-storefront.model';
import { PublicStorefrontService } from '../../../core/services/public-storefront.service';
import { PublicStorefrontRouteService, StorefrontRouteMode } from '../../../core/services/public-storefront-route.service';
import { StorefrontAnalyticsService } from '../../../core/services/storefront-analytics.service';
import { StoreCartService } from '../../../core/services/store-cart.service';
import { ToastService } from '../../../core/services/toast.service';
import { StorefrontPublicHeaderComponent } from '../shared/storefront-public-header.component';

@Component({
  selector: 'app-storefront-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, StorefrontPublicHeaderComponent],
  templateUrl: './storefront-product-detail.html',
  styleUrl: './storefront-product-detail.css',
})
export class StorefrontProductDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly publicStorefrontService = inject(PublicStorefrontService);
  private readonly storefrontRouteService = inject(PublicStorefrontRouteService);
  private readonly analyticsService = inject(StorefrontAnalyticsService);
  private readonly storeCartService = inject(StoreCartService);
  private readonly toastService = inject(ToastService);

  readonly projectParamMap = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });
  readonly queryParamMap = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });
  readonly projectIdParam = computed(() => this.projectParamMap()?.get('projectId'));
  readonly routeMode = computed<StorefrontRouteMode>(() =>
    this.storefrontRouteService.resolveRouteMode(this.projectIdParam())
  );
  readonly isDomainRoute = computed(() => this.routeMode() === 'domain');
  readonly projectId = computed(() => this.storefrontRouteService.resolveProjectId(this.projectIdParam()));
  readonly productId = computed(() => {
    const productId = Number(this.projectParamMap()?.get('productId') ?? '0');
    return Number.isFinite(productId) && productId > 0 ? productId : 0;
  });
  readonly isEditorPreview = computed(() => this.queryParamMap()?.get('preview') === 'editor');
  readonly previewQueryParams = computed(() => (this.isEditorPreview() ? { preview: 'editor' } : null));
  readonly productsPath = computed(() =>
    this.storefrontRouteService.buildPath(this.projectId(), this.routeMode(), 'products')
  );

  readonly storefront = signal<PublicStorefrontHome | null>(null);
  readonly product = signal<PublicStorefrontProduct | null>(null);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');
  readonly cartCount = computed(() => this.storeCartService.countFor(this.projectId()));

  constructor() {
    this.loadProduct();
  }

  loadProduct(): void {
    const projectId = this.projectId();
    const productId = this.productId();
    if (!projectId || !productId) {
      this.errorMessage.set('Product not found.');
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    forkJoin({
      storefront: this.publicStorefrontService.getStorefront(projectId, { preview: this.isEditorPreview() }),
      product: this.publicStorefrontService.getProduct(projectId, productId, { preview: this.isEditorPreview() }),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ storefront, product }) => {
          this.storefront.set(storefront);
          this.product.set(product);
          this.isLoading.set(false);
          if (!this.isEditorPreview()) {
            this.analyticsService.trackPageView(
              projectId,
              window.location.pathname,
              `${product.name} - ${storefront.storeName}`
            );
          }
        },
        error: () => {
          this.storefront.set(null);
          this.product.set(null);
          this.errorMessage.set('Unable to load this product right now.');
          this.isLoading.set(false);
        },
      });
  }

  addToCart(): void {
    const product = this.product();
    if (!product) {
      return;
    }

    this.storeCartService.addItem(this.projectId(), product, 1);
    this.toastService.success(`${product.name} added to cart.`);
  }

  goToCheckout(): void {
    this.addToCart();
    void this.router.navigateByUrl(
      this.storefrontRouteService.buildUrl(
        this.projectId(),
        this.routeMode(),
        'cart',
        this.previewQueryParams() ?? undefined
      )
    );
  }
}
