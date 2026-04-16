import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';

import { ProjectCatalogProduct } from '../../../../../../../../core/models/project-catalog.model';
import { StorefrontEditorCartContentNode } from '../storefront-editor-component.model';

type CartPreviewItem = {
  id: number;
  name: string;
  category: string | null;
  price: number;
  imageUrl: string | null;
  quantity: number;
};

const MOCK_CART_ITEMS: CartPreviewItem[] = [
  {
    id: 9001,
    name: 'Mock Hoodie',
    category: 'Apparel',
    price: 120,
    imageUrl: null,
    quantity: 1,
  },
  {
    id: 9002,
    name: 'Mock Sneakers',
    category: 'Footwear',
    price: 180,
    imageUrl: null,
    quantity: 2,
  },
  {
    id: 9003,
    name: 'Mock Cap',
    category: 'Accessories',
    price: 45,
    imageUrl: null,
    quantity: 1,
  },
];

@Component({
  selector: 'app-storefront-editor-block-cart-content',
  standalone: true,
  imports: [CommonModule, CurrencyPipe],
  template: `
    <section class="storefront-editor-cart-content">
      <div class="storefront-editor-cart-content__main">
        <h2>{{ node().props.cartTitle }}</h2>

        @if (items().length) {
          <div class="storefront-editor-cart-content__items">
            @for (item of items(); track item.id) {
              <article class="storefront-editor-cart-content__item">
                @if (node().props.showImages) {
                  <div class="storefront-editor-cart-content__item-media">
                    @if (item.imageUrl) {
                      <img [src]="item.imageUrl" [alt]="item.name" />
                    } @else {
                      <div>{{ item.name.slice(0, 1) }}</div>
                    }
                  </div>
                }

                <div class="storefront-editor-cart-content__item-copy">
                  <strong>{{ item.name }}</strong>
                  @if (node().props.showMeta) {
                    <span>{{ item.category || 'Store item' }}</span>
                  }
                  <em>{{ item.price | currency:'TND':'symbol':'1.0-2' }}</em>
                </div>

                <button type="button" class="storefront-editor-cart-content__remove" disabled>🗑</button>

                <div class="storefront-editor-cart-content__stepper">
                  <button type="button" disabled>-</button>
                  <span>{{ item.quantity }}</span>
                  <button type="button" disabled>+</button>
                </div>
              </article>
            }
          </div>
        } @else {
          <div class="storefront-editor-cart-content__empty">
            <strong>{{ node().props.emptyTitle }}</strong>
            <p>{{ node().props.emptyDescription }}</p>
            <button type="button" disabled>{{ node().props.emptyButtonLabel }}</button>
          </div>
        }
      </div>

      <aside class="storefront-editor-cart-content__summary">
        <h3>{{ node().props.summaryTitle }}</h3>
        <div class="storefront-editor-cart-content__summary-rows">
          <div><span>{{ node().props.subtotalLabel }}</span><strong>{{ subtotal() | currency:'TND':'symbol':'1.0-2' }}</strong></div>
          <div><span>{{ node().props.totalLabel }}</span><strong>{{ subtotal() | currency:'TND':'symbol':'1.0-2' }}</strong></div>
        </div>

        @if (node().props.showPromoCode) {
          <div class="storefront-editor-cart-content__promo">
            <input type="text" [value]="node().props.promoPlaceholder" readonly />
            <button type="button" disabled>{{ node().props.applyLabel }}</button>
          </div>
        }

        <button type="button" class="storefront-editor-cart-content__checkout" disabled>
          {{ node().props.checkoutLabel }}
        </button>
      </aside>
    </section>
  `,
  styles: [`
    :host { display:block; width:100%; height:100%; }
    .storefront-editor-cart-content { display:grid; grid-template-columns:minmax(0, 1.45fr) minmax(280px, .8fr); gap:24px; width:100%; height:100%; padding:24px; background:#fff; box-sizing:border-box; }
    .storefront-editor-cart-content__main h2 { margin:0 0 18px; font:500 34px/1 Poppins,sans-serif; letter-spacing:-.04em; color:#111827; }
    .storefront-editor-cart-content__items { display:flex; flex-direction:column; gap:14px; }
    .storefront-editor-cart-content__item, .storefront-editor-cart-content__summary {
      border:1px solid #ece7df; border-radius:24px; background:#fffdf9;
    }
    .storefront-editor-cart-content__item { display:grid; grid-template-columns:auto minmax(0,1fr) auto auto; gap:18px; align-items:center; padding:18px; }
    .storefront-editor-cart-content__item-media { width:88px; height:88px; border-radius:16px; background:#f8fafc; overflow:hidden; display:flex; align-items:center; justify-content:center; }
    .storefront-editor-cart-content__item-media img { width:100%; height:100%; object-fit:cover; display:block; }
    .storefront-editor-cart-content__item-copy { display:flex; flex-direction:column; gap:6px; min-width:0; }
    .storefront-editor-cart-content__item-copy strong { font:600 22px/1.2 Poppins,sans-serif; color:#111827; }
    .storefront-editor-cart-content__item-copy span { font:400 14px/1.4 Poppins,sans-serif; color:#64748b; }
    .storefront-editor-cart-content__item-copy em { font-style:normal; font:700 18px/1.2 Poppins,sans-serif; color:#111827; }
    .storefront-editor-cart-content__remove { border:0; background:transparent; font-size:20px; opacity:.55; }
    .storefront-editor-cart-content__stepper { display:flex; align-items:center; gap:22px; border-radius:999px; background:#fff; border:1px solid #ece7df; padding:10px 18px; }
    .storefront-editor-cart-content__stepper button { border:0; background:transparent; font:500 24px/1 Poppins,sans-serif; color:#64748b; }
    .storefront-editor-cart-content__stepper span { font:500 20px/1 Poppins,sans-serif; color:#111827; }
    .storefront-editor-cart-content__summary { padding:22px; display:flex; flex-direction:column; gap:18px; }
    .storefront-editor-cart-content__summary h3 { margin:0; font:600 28px/1.1 Poppins,sans-serif; color:#111827; }
    .storefront-editor-cart-content__summary-rows { display:flex; flex-direction:column; gap:14px; }
    .storefront-editor-cart-content__summary-rows div { display:flex; justify-content:space-between; align-items:center; gap:16px; font:500 16px/1.4 Poppins,sans-serif; color:#475569; }
    .storefront-editor-cart-content__summary-rows strong { color:#111827; font-weight:700; }
    .storefront-editor-cart-content__promo { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:10px; }
    .storefront-editor-cart-content__promo input { min-width:0; height:48px; border:1px solid #ece7df; border-radius:999px; background:#fff; padding:0 18px; font:500 14px/1 Poppins,sans-serif; color:#94a3b8; }
    .storefront-editor-cart-content__promo button, .storefront-editor-cart-content__checkout, .storefront-editor-cart-content__empty button {
      height:48px; border-radius:999px; border:0; background:#111827; color:#fff; font:600 14px/1 Poppins,sans-serif; padding:0 22px;
    }
    .storefront-editor-cart-content__checkout { height:54px; margin-top:auto; }
    .storefront-editor-cart-content__empty { border:1px dashed #cbd5e1; border-radius:24px; padding:30px 24px; display:flex; flex-direction:column; align-items:flex-start; gap:12px; background:#fff; }
    .storefront-editor-cart-content__empty strong { font:600 24px/1.15 Poppins,sans-serif; color:#111827; }
    .storefront-editor-cart-content__empty p { margin:0; font:400 15px/1.6 Poppins,sans-serif; color:#64748b; }
    @media (max-width: 900px) { .storefront-editor-cart-content { grid-template-columns:1fr; } }
  `],
})
export class StorefrontEditorBlockCartContentComponent {
  readonly node = input.required<StorefrontEditorCartContentNode>();
  readonly products = input<ProjectCatalogProduct[]>([]);

  readonly items = computed<CartPreviewItem[]>(() => {
    const mappedProducts = this.products()
      .slice(0, 3)
      .map((product, index) => ({
        id: product.id,
        name: product.name,
        category: product.category,
        price: product.price,
        imageUrl: product.imageUrl,
        quantity: index === 0 ? 2 : 1,
      }));

    return mappedProducts.length ? mappedProducts : MOCK_CART_ITEMS;
  });

  readonly subtotal = computed(() =>
    this.items().reduce((total, item) => total + item.price * item.quantity, 0)
  );
}
