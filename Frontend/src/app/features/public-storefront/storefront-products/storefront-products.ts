import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';

import { PublicStorefrontHome, PublicStorefrontProduct } from '../../../core/models/public-storefront.model';
import { PublicStorefrontService } from '../../../core/services/public-storefront.service';

@Component({
  selector: 'app-storefront-products',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './storefront-products.html',
  styleUrl: './storefront-products.css',
})
export class StorefrontProducts {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly publicStorefrontService = inject(PublicStorefrontService);

  readonly projectParamMap = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });
  readonly projectId = computed(() => {
    const projectId = Number(this.projectParamMap()?.get('projectId') ?? '0');
    return Number.isFinite(projectId) && projectId > 0 ? projectId : 0;
  });

  readonly storefront = signal<PublicStorefrontHome | null>(null);
  readonly products = signal<PublicStorefrontProduct[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');

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
      storefront: this.publicStorefrontService.getStorefront(projectId),
      products: this.publicStorefrontService.getProducts(projectId),
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
}
