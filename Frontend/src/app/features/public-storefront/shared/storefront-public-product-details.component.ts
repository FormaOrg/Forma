import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';

import { PublicStorefrontProduct } from '../../../core/models/public-storefront.model';
import { PublicStorefrontRouteService } from '../../../core/services/public-storefront-route.service';
import { StoreCartService } from '../../../core/services/store-cart.service';
import { ToastService } from '../../../core/services/toast.service';
import { StorefrontEditorProductDetailsNode } from '../../app/dashboard/pages/projects/project-storefront-editor/components/storefront-editor-component.model';

@Component({
  selector: 'app-storefront-public-product-details',
  standalone: true,
  imports: [CommonModule, CurrencyPipe],
  template: `
    @if (product(); as product) {
      <article class="storefront-public-product-details">
        <div class="storefront-public-product-details__media">
          @if (product.imageUrl) {
            <img [src]="product.imageUrl" [alt]="product.name" />
          } @else {
            <div class="storefront-public-product-details__placeholder">{{ product.name.slice(0, 1) }}</div>
          }
        </div>

        <div class="storefront-public-product-details__content">
          @if (node().props.showCategory && product.category) {
            <span class="storefront-public-product-details__eyebrow">{{ product.category }}</span>
          }

          <h2>{{ product.name }}</h2>

          <div class="storefront-public-product-details__price-row">
            <strong>{{ product.price | currency:'TND':'symbol':'1.0-2' }}</strong>
            @if (node().props.showCompareAtPrice && product.compareAtPrice) {
              <span>{{ product.compareAtPrice | currency:'TND':'symbol':'1.0-2' }}</span>
            }
          </div>

          <p class="storefront-public-product-details__stock" [class.storefront-public-product-details__stock--out]="!inStock()">
            {{ inStock() ? node().props.inStockLabel : node().props.outOfStockLabel }}
          </p>

          @if (node().props.showDescription && product.description) {
            <p class="storefront-public-product-details__description">{{ product.description }}</p>
          }

          @if (node().props.showFacts) {
            <div class="storefront-public-product-details__facts">
              @if (product.sku) {
                <div>
                  <span>{{ node().props.skuLabel }}</span>
                  <strong>{{ product.sku }}</strong>
                </div>
              }
              <div>
                <span>Type</span>
                <strong>{{ product.productType || 'PHYSICAL' }}</strong>
              </div>
              <div>
                <span>Availability</span>
                <strong>{{ product.inventoryQuantity }} in stock</strong>
              </div>
            </div>
          }

          @if (node().props.showTags && product.tags.length) {
            <div class="storefront-public-product-details__tags">
              @for (tag of product.tags; track tag) {
                <span>{{ tag }}</span>
              }
            </div>
          }

          <div class="storefront-public-product-details__quantity">
            <span>{{ node().props.quantityLabel }}</span>
            <div class="storefront-public-product-details__stepper">
              <button type="button" (click)="decrementQuantity()" [disabled]="quantity() <= 1">-</button>
              <span>{{ quantity() }}</span>
              <button type="button" (click)="incrementQuantity()" [disabled]="!inStock()">+</button>
            </div>
          </div>

          <div class="storefront-public-product-details__actions">
            <button type="button" (click)="addToCart()" [disabled]="!inStock()">{{ node().props.addToCartLabel }}</button>
            <button type="button" class="storefront-public-product-details__buy-now" (click)="goToCheckout()" [disabled]="!inStock()">
              {{ node().props.buyNowLabel }}
            </button>
          </div>
        </div>
      </article>
    }
  `,
  styles: [`
    :host { display:block; width:100%; height:100%; container-type:inline-size; }
    .storefront-public-product-details {
      display:grid; grid-template-columns:minmax(0, 1fr) minmax(0, .9fr); gap:20px;
      width:100%; height:100%; padding:16px; box-sizing:border-box; background:#fff; color:#0f172a;
      align-items:stretch;
    }
    .storefront-public-product-details__media { border-radius:24px; background:#f8fafc; overflow:hidden; min-height:0; height:100%; display:flex; align-items:center; justify-content:center; }
    .storefront-public-product-details__media img { width:100%; height:100%; object-fit:cover; display:block; }
    .storefront-public-product-details__placeholder { font:600 72px/1 Poppins,sans-serif; color:#cbd5e1; }
    .storefront-public-product-details__content { display:flex; flex-direction:column; gap:12px; min-width:0; min-height:0; overflow:auto; padding-right:4px; }
    .storefront-public-product-details__eyebrow { font:600 12px/1.2 Poppins,sans-serif; letter-spacing:.14em; text-transform:uppercase; color:#64748b; }
    .storefront-public-product-details__content h2 { margin:0; font:600 34px/1.02 Poppins,sans-serif; letter-spacing:-.04em; }
    .storefront-public-product-details__price-row { display:flex; align-items:baseline; gap:10px; flex-wrap:wrap; }
    .storefront-public-product-details__price-row strong { font:700 24px/1 Poppins,sans-serif; }
    .storefront-public-product-details__price-row span { color:#94a3b8; text-decoration:line-through; font:500 16px/1 Poppins,sans-serif; }
    .storefront-public-product-details__stock { margin:0; font:500 14px/1.4 Poppins,sans-serif; color:#166534; }
    .storefront-public-product-details__stock--out { color:#b91c1c; }
    .storefront-public-product-details__description { margin:0; font:400 14px/1.6 Poppins,sans-serif; color:#475569; }
    .storefront-public-product-details__facts { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; }
    .storefront-public-product-details__facts div { border:1px solid #e2e8f0; border-radius:16px; padding:12px 14px; display:flex; flex-direction:column; gap:6px; }
    .storefront-public-product-details__facts span { font:500 12px/1.2 Poppins,sans-serif; text-transform:uppercase; letter-spacing:.08em; color:#94a3b8; }
    .storefront-public-product-details__facts strong { font:600 14px/1.3 Poppins,sans-serif; color:#0f172a; }
    .storefront-public-product-details__tags { display:flex; flex-wrap:wrap; gap:8px; }
    .storefront-public-product-details__tags span { border:1px solid #e2e8f0; border-radius:999px; padding:6px 12px; font:500 12px/1.2 Poppins,sans-serif; color:#334155; }
    .storefront-public-product-details__quantity { display:flex; flex-direction:column; gap:8px; font:500 14px/1.3 Poppins,sans-serif; color:#475569; }
    .storefront-public-product-details__stepper { width:max-content; display:flex; align-items:center; gap:22px; border-radius:999px; background:#f8fafc; padding:10px 16px; }
    .storefront-public-product-details__stepper button { border:0; background:transparent; color:#64748b; font:500 24px/1 Poppins,sans-serif; cursor:pointer; }
    .storefront-public-product-details__stepper button[disabled] { cursor:not-allowed; opacity:.45; }
    .storefront-public-product-details__stepper span { font:500 20px/1 Poppins,sans-serif; color:#0f172a; }
    .storefront-public-product-details__actions { display:flex; gap:10px; margin-top:4px; }
    .storefront-public-product-details__actions button { min-height:46px; border-radius:999px; border:1px solid #111827; padding:0 20px; background:#111827; color:#fff; font:600 14px/1 Poppins,sans-serif; cursor:pointer; }
    .storefront-public-product-details__actions button[disabled] { cursor:not-allowed; opacity:.45; }
    .storefront-public-product-details__buy-now { background:#fff !important; color:#111827 !important; }
    @container (max-width: 980px) {
      .storefront-public-product-details { grid-template-columns:minmax(0, .9fr) minmax(0, 1.1fr); gap:16px; padding:14px; }
      .storefront-public-product-details__media { min-height:180px; max-height:none; border-radius:20px; }
      .storefront-public-product-details__content { gap:10px; }
      .storefront-public-product-details__content h2 { font-size:32px; }
      .storefront-public-product-details__price-row strong { font-size:24px; }
      .storefront-public-product-details__price-row span { font-size:16px; }
      .storefront-public-product-details__facts { grid-template-columns:1fr; }
      .storefront-public-product-details__actions { flex-direction:column; margin-top:0; }
      .storefront-public-product-details__actions button { width:100%; }
    }
    @container (max-width: 680px) {
      .storefront-public-product-details { grid-template-columns:1fr; gap:16px; padding:14px; height:auto; }
      .storefront-public-product-details__media { min-height:180px; max-height:260px; aspect-ratio:4 / 3; border-radius:16px; }
      .storefront-public-product-details__content { gap:12px; }
      .storefront-public-product-details__content h2 { font-size:26px; }
      .storefront-public-product-details__price-row strong { font-size:22px; }
      .storefront-public-product-details__price-row span { font-size:15px; }
      .storefront-public-product-details__facts { grid-template-columns:1fr; }
      .storefront-public-product-details__stepper { gap:18px; padding:9px 14px; }
      .storefront-public-product-details__stepper span { font-size:17px; }
    }
  `],
})
export class StorefrontPublicProductDetailsComponent {
  private readonly storefrontRouteService = inject(PublicStorefrontRouteService);
  private readonly storeCartService = inject(StoreCartService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  readonly node = input.required<StorefrontEditorProductDetailsNode>();
  readonly products = input<PublicStorefrontProduct[]>([]);
  readonly productId = input<number | null>(null);
  readonly storefrontProjectId = input.required<number>();
  readonly storefrontIsEditorPreview = input(false);
  readonly storefrontIsDomainRoute = input(false);

  readonly quantity = signal(1);
  readonly product = computed(() => {
    const selectedId = this.productId();
    const products = this.products();
    return products.find((entry) => entry.id === selectedId) ?? products[0] ?? null;
  });
  readonly inStock = computed(() => (this.product()?.inventoryQuantity ?? 0) > 0);

  incrementQuantity(): void {
    if (!this.inStock()) {
      return;
    }

    this.quantity.update((value) => value + 1);
  }

  decrementQuantity(): void {
    this.quantity.update((value) => Math.max(1, value - 1));
  }

  addToCart(): void {
    const product = this.product();
    if (!product) {
      return;
    }

    this.storeCartService.addItem(this.storefrontProjectId(), product, this.quantity());
    this.toastService.success(`${product.name} added to cart.`);
  }

  goToCheckout(): void {
    const product = this.product();
    if (!product) {
      return;
    }

    this.storeCartService.addItem(this.storefrontProjectId(), product, this.quantity());
    this.toastService.success(`${product.name} added to cart.`);
    void this.router.navigateByUrl(
      this.storefrontRouteService.buildUrl(
        this.storefrontProjectId(),
        this.storefrontIsDomainRoute() ? 'domain' : 'path',
        'cart',
        this.storefrontIsEditorPreview() ? { preview: 'editor' } : undefined
      )
    );
  }
}
