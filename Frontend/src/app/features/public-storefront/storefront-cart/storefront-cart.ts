import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';

import { PublicStorefrontHome } from '../../../core/models/public-storefront.model';
import { PublicStorefrontService } from '../../../core/services/public-storefront.service';
import { StoreCartService } from '../../../core/services/store-cart.service';
import { StorefrontPublicHeaderComponent } from '../shared/storefront-public-header.component';

@Component({
  selector: 'app-storefront-cart',
  standalone: true,
  imports: [CommonModule, RouterLink, StorefrontPublicHeaderComponent],
  templateUrl: './storefront-cart.html',
  styleUrl: './storefront-cart.css',
})
export class StorefrontCart {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly publicStorefrontService = inject(PublicStorefrontService);
  private readonly storeCartService = inject(StoreCartService);

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
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');
  readonly items = computed(() => this.storeCartService.itemsFor(this.projectId()));
  readonly subtotal = computed(() => this.storeCartService.subtotalFor(this.projectId()));

  constructor() {
    this.loadStorefront();
  }

  loadStorefront(): void {
    const projectId = this.projectId();
    if (!projectId) {
      this.errorMessage.set('Storefront not found.');
      this.isLoading.set(false);
      return;
    }

    this.publicStorefrontService
      .getStorefront(projectId, { preview: this.isEditorPreview() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (storefront) => {
          this.storefront.set(storefront);
          this.isLoading.set(false);
        },
        error: () => {
          this.storefront.set(null);
          this.errorMessage.set('Unable to load this cart right now.');
          this.isLoading.set(false);
        },
      });
  }

  increaseQuantity(productId: number, quantity: number): void {
    this.storeCartService.updateQuantity(this.projectId(), productId, quantity + 1);
  }

  decreaseQuantity(productId: number, quantity: number): void {
    this.storeCartService.updateQuantity(this.projectId(), productId, quantity - 1);
  }

  removeItem(productId: number): void {
    this.storeCartService.removeItem(this.projectId(), productId);
  }
}
