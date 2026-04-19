import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';

import { PublicStorefrontHome, PublicStorefrontProduct } from '../../../core/models/public-storefront.model';
import { PublicStorefrontService } from '../../../core/services/public-storefront.service';
import { PublicStorefrontRouteService, StorefrontRouteMode } from '../../../core/services/public-storefront-route.service';
import { StorefrontAnalyticsService } from '../../../core/services/storefront-analytics.service';
import { StoreCartService } from '../../../core/services/store-cart.service';
import { ToastService } from '../../../core/services/toast.service';
import { StorefrontHomepageDocument } from '../../../core/models/project-storefront.model';
import { StorefrontEditorPreviewPageComponent } from '../shared/storefront-editor-preview-page.component';
import { StorefrontPublicHeaderComponent } from '../shared/storefront-public-header.component';

@Component({
  selector: 'app-storefront-products',
  standalone: true,
  imports: [CommonModule, StorefrontPublicHeaderComponent, StorefrontEditorPreviewPageComponent],
  templateUrl: './storefront-products.html',
  styleUrl: './storefront-products.css',
})
export class StorefrontProducts {
  private readonly route = inject(ActivatedRoute);
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
  readonly isEditorPreview = computed(() => this.queryParamMap()?.get('preview') === 'editor');
  readonly previewQueryParams = computed(() => (this.isEditorPreview() ? { preview: 'editor' } : null));

  readonly storefront = signal<PublicStorefrontHome | null>(null);
  readonly products = signal<PublicStorefrontProduct[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');
  readonly cartCount = computed(() => this.storeCartService.countFor(this.projectId()));
  readonly selectedCategory = computed(() => this.normalizeCategoryToken(this.queryParamMap()?.get('category')));
  readonly filteredProducts = computed(() => {
    const category = this.selectedCategory();
    const catalog = this.products();

    if (!category || category === 'all') {
      return catalog;
    }

    return catalog.filter((product) => this.matchesCategory(product, category));
  });
  readonly selectedCategoryLabel = computed(() => {
    const category = this.selectedCategory();
    if (!category || category === 'all') {
      return '';
    }

    if (this.isBestSellerCategory(category)) {
      return 'Best sellers';
    }

    return category
      .split('-')
      .filter(Boolean)
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(' ');
  });
  readonly previewDocument = computed<StorefrontHomepageDocument | null>(() =>
    this.applyCategoryToPreviewDocument(
      this.isEditorPreview() ? this.publicStorefrontService.readEditorPreviewPageDocument(this.projectId(), 'products') : null,
      this.selectedCategory()
    )
  );

  constructor() {
    this.loadProducts();
  }

  loadProducts(): void {
    const projectId = this.projectId();
    if (!projectId) {
      this.errorMessage.set('Storefront not found.');
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
          this.products.set(products);
          this.isLoading.set(false);
          if (!this.isEditorPreview()) {
            this.analyticsService.trackPageView(
              projectId,
              window.location.pathname,
              `Products - ${storefront.storeName}`
            );
          }
        },
        error: () => {
          this.storefront.set(null);
          this.products.set([]);
          this.errorMessage.set('Unable to load this storefront catalog right now.');
          this.isLoading.set(false);
        },
      });
  }

  trackProduct = (_: number, product: PublicStorefrontProduct): number => product.id;

  productRoute(productId: number): string {
    return this.storefrontRouteService.buildUrl(
      this.projectId(),
      this.routeMode(),
      `products/${productId}`,
      this.previewQueryParams() ?? undefined
    );
  }

  addToCart(product: PublicStorefrontProduct): void {
    this.storeCartService.addItem(this.projectId(), product, 1);
    this.toastService.success(`${product.name} added to cart.`);
  }

  private applyCategoryToPreviewDocument(
    document: StorefrontHomepageDocument | null,
    category: string
  ): StorefrontHomepageDocument | null {
    if (!document || !category || category === 'all') {
      return document;
    }

    const clone = JSON.parse(JSON.stringify(document)) as StorefrontHomepageDocument;

    for (const section of clone.sections) {
      const props = section.props as Record<string, unknown>;
      const components = Array.isArray(props['editorComponents'])
        ? (props['editorComponents'] as Array<Record<string, unknown>>)
        : [];

      for (const component of components) {
        if (component['type'] !== 'product-feed') {
          continue;
        }

        const componentProps =
          component['props'] && typeof component['props'] === 'object'
            ? (component['props'] as Record<string, unknown>)
            : null;

        if (!componentProps) {
          continue;
        }

        componentProps['category'] = category;
      }
    }

    return clone;
  }

  private matchesCategory(product: PublicStorefrontProduct, category: string): boolean {
    if (this.isBestSellerCategory(category)) {
      return product.tags.some((tag) => this.isBestSellerCategory(this.normalizeCategoryToken(tag)));
    }

    return this.normalizeCategoryToken(product.category) === category;
  }

  private normalizeCategoryToken(value: string | null | undefined): string {
    return (value ?? '')
      .trim()
      .toLowerCase()
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private isBestSellerCategory(value: string): boolean {
    return value === 'best-seller' || value === 'best-sellers' || value === 'bestseller' || value === 'bestsellers';
  }
}
