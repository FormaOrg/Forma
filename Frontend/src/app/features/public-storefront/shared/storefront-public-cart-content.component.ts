import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { Router } from '@angular/router';

import { PublicStorefrontRouteService } from '../../../core/services/public-storefront-route.service';
import { StoreCartService } from '../../../core/services/store-cart.service';
import { StorefrontEditorCartContentNode } from '../../app/dashboard/pages/projects/project-storefront-editor/components/storefront-editor-component.model';

@Component({
  selector: 'app-storefront-public-cart-content',
  standalone: true,
  imports: [CommonModule, CurrencyPipe],
  template: `
    <section class="storefront-public-cart-content">
      <div class="storefront-public-cart-content__main">
        <h2>{{ node().props.cartTitle }}</h2>

        @if (items().length) {
          <div class="storefront-public-cart-content__items">
            @for (item of items(); track item.productId) {
              <article class="storefront-public-cart-content__item">
                @if (node().props.showImages) {
                  <div class="storefront-public-cart-content__item-media">
                    @if (item.imageUrl) {
                      <img [src]="item.imageUrl" [alt]="item.name" />
                    } @else {
                      <div>{{ item.name.slice(0, 1) }}</div>
                    }
                  </div>
                }

                <div class="storefront-public-cart-content__item-copy">
                  <strong>{{ item.name }}</strong>
                  @if (node().props.showMeta) {
                    <span>{{ item.category || 'Store item' }}</span>
                  }
                  <em>{{ item.price | currency:'TND':'symbol':'1.0-2' }}</em>
                </div>

                <button type="button" class="storefront-public-cart-content__remove" (click)="removeItem(item.productId)">Remove</button>

                <div class="storefront-public-cart-content__stepper">
                  <button type="button" (click)="decreaseQuantity(item.productId, item.quantity)">-</button>
                  <span>{{ item.quantity }}</span>
                  <button type="button" (click)="increaseQuantity(item.productId, item.quantity)">+</button>
                </div>
              </article>
            }
          </div>
        } @else {
          <div class="storefront-public-cart-content__empty">
            <strong>{{ node().props.emptyTitle }}</strong>
            <p>{{ node().props.emptyDescription }}</p>
            <button type="button" (click)="browseProducts()">{{ node().props.emptyButtonLabel }}</button>
          </div>
        }
      </div>

      <aside class="storefront-public-cart-content__summary">
        <h3>{{ node().props.summaryTitle }}</h3>
        <div class="storefront-public-cart-content__summary-rows">
          <div><span>{{ node().props.subtotalLabel }}</span><strong>{{ subtotal() | currency:'TND':'symbol':'1.0-2' }}</strong></div>
          <div><span>{{ node().props.totalLabel }}</span><strong>{{ subtotal() | currency:'TND':'symbol':'1.0-2' }}</strong></div>
        </div>

        @if (node().props.showPromoCode) {
          <div class="storefront-public-cart-content__promo">
            <div class="storefront-public-cart-content__promo-input">{{ node().props.promoPlaceholder }}</div>
            <button type="button">{{ node().props.applyLabel }}</button>
          </div>
        }

        <button
          type="button"
          class="storefront-public-cart-content__checkout"
          [disabled]="!items().length"
          (click)="goToCheckout()"
        >
          {{ node().props.checkoutLabel }}
        </button>
      </aside>
    </section>
  `,
  styles: [`
    :host { display:block; width:100%; height:100%; container-type:inline-size; }
    .storefront-public-cart-content { display:grid; grid-template-columns:minmax(0, 1.18fr) minmax(280px, .82fr); gap:18px; width:100%; height:100%; padding:18px; background:#fff; box-sizing:border-box; color:#0f172a; }
    .storefront-public-cart-content__main { min-width:0; min-height:0; display:flex; flex-direction:column; }
    .storefront-public-cart-content__main h2 { margin:0 0 14px; font:600 34px/1.04 Poppins,sans-serif; letter-spacing:-.04em; color:#0f172a; }
    .storefront-public-cart-content__items { display:flex; flex-direction:column; gap:10px; min-height:0; overflow:auto; padding-right:4px; }
    .storefront-public-cart-content__item, .storefront-public-cart-content__summary { border:1px solid #e2e8f0; border-radius:24px; background:#f8fafc; }
    .storefront-public-cart-content__item { display:grid; grid-template-columns:auto minmax(0,1fr) auto auto; gap:14px; align-items:center; padding:16px; }
    .storefront-public-cart-content__item-media { width:68px; height:68px; border-radius:14px; background:#ffffff; overflow:hidden; display:flex; align-items:center; justify-content:center; }
    .storefront-public-cart-content__item-media img { width:100%; height:100%; object-fit:cover; display:block; }
    .storefront-public-cart-content__item-copy { display:flex; flex-direction:column; gap:4px; min-width:0; }
    .storefront-public-cart-content__item-copy strong { font:600 18px/1.2 Poppins,sans-serif; color:#0f172a; }
    .storefront-public-cart-content__item-copy span { font:400 12px/1.35 Poppins,sans-serif; color:#64748b; }
    .storefront-public-cart-content__item-copy em { font-style:normal; font:700 15px/1.2 Poppins,sans-serif; color:#0f172a; }
    .storefront-public-cart-content__remove { border:0; background:transparent; font:500 14px/1.2 Poppins,sans-serif; color:#64748b; cursor:pointer; }
    .storefront-public-cart-content__stepper { display:flex; align-items:center; gap:16px; border-radius:999px; background:#ffffff; border:1px solid #e2e8f0; padding:8px 14px; min-height:40px; }
    .storefront-public-cart-content__stepper button { border:0; background:transparent; font:500 18px/1 Poppins,sans-serif; color:#64748b; cursor:pointer; }
    .storefront-public-cart-content__stepper span { font:500 16px/1 Poppins,sans-serif; color:#0f172a; }
    .storefront-public-cart-content__summary { padding:18px; display:flex; flex-direction:column; gap:14px; }
    .storefront-public-cart-content__summary h3 { margin:0; font:600 24px/1.04 Poppins,sans-serif; color:#0f172a; letter-spacing:-.03em; }
    .storefront-public-cart-content__summary-rows { display:flex; flex-direction:column; gap:10px; }
    .storefront-public-cart-content__summary-rows div { display:flex; justify-content:space-between; align-items:center; gap:12px; font:500 14px/1.35 Poppins,sans-serif; color:#475569; }
    .storefront-public-cart-content__summary-rows strong { color:#0f172a; font-weight:700; }
    .storefront-public-cart-content__promo { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:10px; }
    .storefront-public-cart-content__promo-input { min-width:0; min-height:42px; border:1px solid #e2e8f0; border-radius:14px; background:#fff; padding:0 14px; font:400 13px/1.4 Poppins,sans-serif; color:#94a3b8; display:flex; align-items:center; box-sizing:border-box; }
    .storefront-public-cart-content__promo button, .storefront-public-cart-content__checkout, .storefront-public-cart-content__empty button { height:44px; border-radius:999px; border:1px solid #111827; background:#111827; color:#fff; font:600 14px/1 Poppins,sans-serif; padding:0 18px; cursor:pointer; }
    .storefront-public-cart-content__checkout { height:48px; margin-top:auto; }
    .storefront-public-cart-content__checkout[disabled] { cursor:not-allowed; opacity:.45; }
    .storefront-public-cart-content__empty { border:1px solid #e2e8f0; border-radius:24px; padding:24px 20px; display:flex; flex-direction:column; align-items:flex-start; gap:10px; background:#f8fafc; }
    .storefront-public-cart-content__empty strong { font:600 20px/1.15 Poppins,sans-serif; color:#0f172a; }
    .storefront-public-cart-content__empty p { margin:0; font:400 14px/1.55 Poppins,sans-serif; color:#64748b; }
    @container (max-width: 900px) {
      .storefront-public-cart-content { display:flex; flex-wrap:wrap; gap:16px; }
      .storefront-public-cart-content__summary, .storefront-public-cart-content__main { width:100%; box-sizing:border-box; }
      .storefront-public-cart-content__summary { order:-1; }
    }
    @container (max-width: 680px) {
      .storefront-public-cart-content__item { grid-template-columns:auto minmax(0, 1fr); gap:12px; }
      .storefront-public-cart-content__remove, .storefront-public-cart-content__stepper { grid-column:2; }
      .storefront-public-cart-content__remove { justify-self:end; }
      .storefront-public-cart-content__stepper { justify-self:start; }
      .storefront-public-cart-content__promo { grid-template-columns:1fr; }
    }
  `],
})
export class StorefrontPublicCartContentComponent {
  private readonly storefrontRouteService = inject(PublicStorefrontRouteService);
  private readonly storeCartService = inject(StoreCartService);
  private readonly router = inject(Router);

  readonly node = input.required<StorefrontEditorCartContentNode>();
  readonly storefrontProjectId = input.required<number>();
  readonly storefrontIsEditorPreview = input(false);
  readonly storefrontIsDomainRoute = input(false);

  readonly items = computed(() => this.storeCartService.itemsFor(this.storefrontProjectId()));
  readonly subtotal = computed(() => this.storeCartService.subtotalFor(this.storefrontProjectId()));

  increaseQuantity(productId: number, quantity: number): void {
    this.storeCartService.updateQuantity(this.storefrontProjectId(), productId, quantity + 1);
  }

  decreaseQuantity(productId: number, quantity: number): void {
    this.storeCartService.updateQuantity(this.storefrontProjectId(), productId, quantity - 1);
  }

  removeItem(productId: number): void {
    this.storeCartService.removeItem(this.storefrontProjectId(), productId);
  }

  browseProducts(): void {
    void this.router.navigateByUrl(
      this.storefrontRouteService.buildUrl(
        this.storefrontProjectId(),
        this.storefrontIsDomainRoute() ? 'domain' : 'path',
        'products',
        this.storefrontIsEditorPreview() ? { preview: 'editor' } : undefined
      )
    );
  }

  goToCheckout(): void {
    if (!this.items().length) {
      return;
    }

    void this.router.navigateByUrl(
      this.storefrontRouteService.buildUrl(
        this.storefrontProjectId(),
        this.storefrontIsDomainRoute() ? 'domain' : 'path',
        'checkout',
        this.storefrontIsEditorPreview() ? { preview: 'editor' } : undefined
      )
    );
  }
}
