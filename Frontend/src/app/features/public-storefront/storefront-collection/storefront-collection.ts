import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';

import { PublicStorefrontHome, PublicStorefrontProduct } from '../../../core/models/public-storefront.model';
import { PublicStorefrontService } from '../../../core/services/public-storefront.service';
import { StorefrontAnalyticsService } from '../../../core/services/storefront-analytics.service';
import { StoreCartService } from '../../../core/services/store-cart.service';
import { ToastService } from '../../../core/services/toast.service';
import { StorefrontPublicHeaderComponent } from '../shared/storefront-public-header.component';

@Component({
  selector: 'app-storefront-collection',
  standalone: true,
  imports: [CommonModule, StorefrontPublicHeaderComponent],
  templateUrl: './storefront-collection.html',
  styleUrl: './storefront-collection.css',
})
export class StorefrontCollection {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly publicStorefrontService = inject(PublicStorefrontService);
  private readonly analyticsService = inject(StorefrontAnalyticsService);
  private readonly storeCartService = inject(StoreCartService);
  private readonly toastService = inject(ToastService);

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
  readonly collectionSlug = computed(() => (this.projectParamMap()?.get('collectionSlug') ?? '').trim());
  readonly isEditorPreview = computed(() => this.queryParamMap()?.get('preview') === 'editor');
  readonly previewQueryParams = computed(() => (this.isEditorPreview() ? { preview: 'editor' } : null));

  readonly storefront = signal<PublicStorefrontHome | null>(null);
  readonly allProducts = signal<PublicStorefrontProduct[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');
  readonly cartCount = computed(() => this.storeCartService.countFor(this.projectId()));

  readonly collectionTitle = computed(() => {
    const slug = this.collectionSlug();
    if (slug === 'all') {
      return 'All products';
    }
    const products = this.products();
    if (products.length) {
      const matchingCategory = products.find((product) => this.normalizeValue(product.category) === slug)?.category;
      if (matchingCategory) {
        return matchingCategory;
      }

      for (const product of products) {
        const matchingTag = product.tags.find((tag) => this.normalizeValue(tag) === slug);
        if (matchingTag) {
          return matchingTag;
        }
      }
    }

    return this.humanizeSlug(slug) || 'Collection';
  });
  readonly products = computed(() => {
    const slug = this.collectionSlug();
    if (!slug) {
      return [] as PublicStorefrontProduct[];
    }

    if (slug === 'all') {
      return this.allProducts();
    }

    return this.allProducts().filter((product) => {
      if (this.normalizeValue(product.category) === slug) {
        return true;
      }

      return product.tags.some((tag) => this.normalizeValue(tag) === slug);
    });
  });
  readonly collectionSummary = computed(() => {
    const count = this.products().length;
    const noun = this.isEditorPreview() ? 'preview item' : 'live item';
    return `${count} ${noun}${count === 1 ? '' : 's'} in this collection.`;
  });

  constructor() {
    this.loadCollection();
  }

  loadCollection(): void {
    const projectId = this.projectId();
    const collectionSlug = this.collectionSlug();
    if (!projectId || !collectionSlug) {
      this.errorMessage.set('Collection not found.');
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    forkJoin({
      storefront: this.publicStorefrontService.getStorefront(projectId, { preview: this.isEditorPreview() }),
      products: this.publicStorefrontService.getProducts(projectId, { preview: this.isEditorPreview() }),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ storefront, products }) => {
          this.storefront.set(storefront);
          this.allProducts.set(products);
          this.isLoading.set(false);
          if (!this.isEditorPreview()) {
            this.analyticsService.trackPageView(
              projectId,
              window.location.pathname,
              `${this.collectionTitle()} – ${storefront.storeName}`,
            );
          }
        },
        error: () => {
          this.storefront.set(null);
          this.allProducts.set([]);
          this.errorMessage.set('Unable to load this collection right now.');
          this.isLoading.set(false);
        },
      });
  }

  trackProduct = (_: number, product: PublicStorefrontProduct): number => product.id;

  productRoute(productId: number): string {
    return this.isEditorPreview()
      ? `/store/${this.projectId()}/products/${productId}?preview=editor`
      : `/store/${this.projectId()}/products/${productId}`;
  }

  addToCart(product: PublicStorefrontProduct): void {
    this.storeCartService.addItem(this.projectId(), product, 1);
    this.toastService.success(`${product.name} added to cart.`);
  }

  private normalizeValue(value: string | null | undefined): string {
    return (value ?? '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private humanizeSlug(value: string): string {
    return value
      .split('-')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
}
