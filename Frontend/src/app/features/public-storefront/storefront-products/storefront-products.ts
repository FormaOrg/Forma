import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';

import { PublicStorefrontHome, PublicStorefrontProduct } from '../../../core/models/public-storefront.model';
import { PublicStorefrontService } from '../../../core/services/public-storefront.service';
import { StoreCartService } from '../../../core/services/store-cart.service';
import { ToastService } from '../../../core/services/toast.service';
import { StorefrontPublicHeaderComponent } from '../shared/storefront-public-header.component';

@Component({
  selector: 'app-storefront-products',
  standalone: true,
  imports: [CommonModule, StorefrontPublicHeaderComponent],
  templateUrl: './storefront-products.html',
  styleUrl: './storefront-products.css',
})
export class StorefrontProducts {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly publicStorefrontService = inject(PublicStorefrontService);
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
  readonly isEditorPreview = computed(() => this.queryParamMap()?.get('preview') === 'editor');
  readonly previewQueryParams = computed(() => (this.isEditorPreview() ? { preview: 'editor' } : null));

  readonly storefront = signal<PublicStorefrontHome | null>(null);
  readonly products = signal<PublicStorefrontProduct[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');
  readonly cartCount = computed(() => this.storeCartService.countFor(this.projectId()));

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
    return this.isEditorPreview()
      ? `/store/${this.projectId()}/products/${productId}?preview=editor`
      : `/store/${this.projectId()}/products/${productId}`;
  }

  addToCart(product: PublicStorefrontProduct): void {
    this.storeCartService.addItem(this.projectId(), product, 1);
    this.toastService.success(`${product.name} added to cart.`);
  }
}
