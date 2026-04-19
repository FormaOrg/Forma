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
            <div class="storefront-editor-cart-content__promo-input">{{ node().props.promoPlaceholder }}</div>
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
    :host { display:block; width:100%; height:100%; container-type:inline-size; }
    .storefront-editor-cart-content { display:grid; grid-template-columns:minmax(0, 1.18fr) minmax(280px, .82fr); gap:18px; width:100%; height:100%; padding:18px; background:#fff; box-sizing:border-box; color:#0f172a; }
    .storefront-editor-cart-content__main h2 { margin:0 0 14px; font:600 34px/1.04 Poppins,sans-serif; letter-spacing:-.04em; color:#0f172a; }
    .storefront-editor-cart-content__items { display:flex; flex-direction:column; gap:10px; }
    .storefront-editor-cart-content__item, .storefront-editor-cart-content__summary {
      border:1px solid #e2e8f0; border-radius:24px; background:#f8fafc;
    }
    .storefront-editor-cart-content__item { display:grid; grid-template-columns:auto minmax(0,1fr) auto auto; gap:14px; align-items:center; padding:16px; }
    .storefront-editor-cart-content__item-media { width:68px; height:68px; border-radius:14px; background:#ffffff; overflow:hidden; display:flex; align-items:center; justify-content:center; }
    .storefront-editor-cart-content__item-media img { width:100%; height:100%; object-fit:cover; display:block; }
    .storefront-editor-cart-content__item-copy { display:flex; flex-direction:column; gap:4px; min-width:0; }
    .storefront-editor-cart-content__item-copy strong { font:600 18px/1.2 Poppins,sans-serif; color:#0f172a; }
    .storefront-editor-cart-content__item-copy span { font:400 12px/1.35 Poppins,sans-serif; color:#64748b; }
    .storefront-editor-cart-content__item-copy em { font-style:normal; font:700 15px/1.2 Poppins,sans-serif; color:#0f172a; }
    .storefront-editor-cart-content__remove { border:0; background:transparent; font-size:17px; opacity:.55; color:#64748b; }
    .storefront-editor-cart-content__stepper { display:flex; align-items:center; gap:16px; border-radius:999px; background:#ffffff; border:1px solid #e2e8f0; padding:8px 14px; min-height:40px; }
    .storefront-editor-cart-content__stepper button { border:0; background:transparent; font:500 18px/1 Poppins,sans-serif; color:#64748b; }
    .storefront-editor-cart-content__stepper span { font:500 16px/1 Poppins,sans-serif; color:#0f172a; }
    .storefront-editor-cart-content__summary { padding:18px; display:flex; flex-direction:column; gap:14px; }
    .storefront-editor-cart-content__summary h3 { margin:0; font:600 24px/1.04 Poppins,sans-serif; color:#0f172a; letter-spacing:-.03em; }
    .storefront-editor-cart-content__summary-rows { display:flex; flex-direction:column; gap:10px; }
    .storefront-editor-cart-content__summary-rows div { display:flex; justify-content:space-between; align-items:center; gap:12px; font:500 14px/1.35 Poppins,sans-serif; color:#475569; }
    .storefront-editor-cart-content__summary-rows strong { color:#0f172a; font-weight:700; }
    .storefront-editor-cart-content__promo { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:10px; }
    .storefront-editor-cart-content__promo-input { min-width:0; min-height:42px; border:1px solid #e2e8f0; border-radius:14px; background:#fff; padding:0 14px; font:400 13px/1.4 Poppins,sans-serif; color:#94a3b8; display:flex; align-items:center; box-sizing:border-box; }
    .storefront-editor-cart-content__promo button, .storefront-editor-cart-content__checkout, .storefront-editor-cart-content__empty button {
      height:44px; border-radius:999px; border:1px solid #111827; background:#111827; color:#fff; font:600 14px/1 Poppins,sans-serif; padding:0 18px;
    }
    .storefront-editor-cart-content__checkout { height:48px; margin-top:auto; }
    .storefront-editor-cart-content__empty { border:1px solid #e2e8f0; border-radius:24px; padding:24px 20px; display:flex; flex-direction:column; align-items:flex-start; gap:10px; background:#f8fafc; }
    .storefront-editor-cart-content__empty strong { font:600 20px/1.15 Poppins,sans-serif; color:#0f172a; }
    .storefront-editor-cart-content__empty p { margin:0; font:400 14px/1.55 Poppins,sans-serif; color:#64748b; }
    @container (max-width: 900px) {
      .storefront-editor-cart-content {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
      }

      .storefront-editor-cart-content__summary,
      .storefront-editor-cart-content__main {
        width: 100%;
        box-sizing: border-box;
      }

      .storefront-editor-cart-content__summary {
        order: -1;
      }
    }

    @container (max-width: 680px) {
      .storefront-editor-cart-content__item {
        grid-template-columns: auto minmax(0, 1fr);
        gap: 12px;
      }

      .storefront-editor-cart-content__remove,
      .storefront-editor-cart-content__stepper {
        grid-column: 2;
      }

      .storefront-editor-cart-content__remove {
        justify-self: end;
      }

      .storefront-editor-cart-content__stepper {
        justify-self: start;
      }

      .storefront-editor-cart-content__promo {
        grid-template-columns: 1fr;
      }
    }
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
