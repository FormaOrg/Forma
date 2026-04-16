import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';

import { ProjectCatalogProduct } from '../../../../../../../../core/models/project-catalog.model';
import { StorefrontEditorProductDetailsNode } from '../storefront-editor-component.model';

const MOCK_PRODUCT: ProjectCatalogProduct = {
  id: 0,
  name: 'Mock Product',
  description: 'This is a preview product used when the catalog is empty.',
  sku: 'MOCK-001',
  category: 'Featured',
  productType: 'PHYSICAL',
  status: 'ACTIVE',
  price: 79,
  compareAtPrice: 99,
  inventoryQuantity: 8,
  imageUrl: null,
  tags: ['new', 'bestseller'],
  readyToPublish: true,
  readinessIssues: [],
  createdAt: null,
  updatedAt: null,
};

@Component({
  selector: 'app-storefront-editor-block-product-details',
  standalone: true,
  imports: [CommonModule, CurrencyPipe],
  template: `
    <article class="storefront-editor-product-details">
      <div class="storefront-editor-product-details__media">
        @if (product().imageUrl) {
          <img [src]="product().imageUrl" [alt]="product().name" />
        } @else {
          <div class="storefront-editor-product-details__placeholder">{{ product().name.slice(0, 1) }}</div>
        }
      </div>

      <div class="storefront-editor-product-details__content">
        @if (node().props.showCategory && product().category) {
          <span class="storefront-editor-product-details__eyebrow">{{ product().category }}</span>
        }

        <h2>{{ product().name }}</h2>

        <div class="storefront-editor-product-details__price-row">
          <strong>{{ product().price | currency:'TND':'symbol':'1.0-2' }}</strong>
          @if (node().props.showCompareAtPrice && product().compareAtPrice) {
            <span>{{ product().compareAtPrice | currency:'TND':'symbol':'1.0-2' }}</span>
          }
        </div>

        <p class="storefront-editor-product-details__stock" [class.storefront-editor-product-details__stock--out]="!inStock()">
          {{ inStock() ? node().props.inStockLabel : node().props.outOfStockLabel }}
        </p>

        @if (node().props.showDescription && product().description) {
          <p class="storefront-editor-product-details__description">{{ product().description }}</p>
        }

        @if (node().props.showFacts) {
          <div class="storefront-editor-product-details__facts">
            @if (product().sku) {
              <div>
                <span>{{ node().props.skuLabel }}</span>
                <strong>{{ product().sku }}</strong>
              </div>
            }
            <div>
              <span>Type</span>
              <strong>{{ product().productType || 'Product' }}</strong>
            </div>
          </div>
        }

        @if (node().props.showTags && product().tags.length) {
          <div class="storefront-editor-product-details__tags">
            @for (tag of product().tags; track tag) {
              <span>{{ tag }}</span>
            }
          </div>
        }

        <div class="storefront-editor-product-details__quantity">
          <span>{{ node().props.quantityLabel }}</span>
          <div class="storefront-editor-product-details__stepper">
            <button type="button" disabled>-</button>
            <span>1</span>
            <button type="button" disabled>+</button>
          </div>
        </div>

        <div class="storefront-editor-product-details__actions">
          <button type="button" [disabled]="!inStock()">{{ node().props.addToCartLabel }}</button>
          <button type="button" class="storefront-editor-product-details__buy-now" [disabled]="!inStock()">
            {{ node().props.buyNowLabel }}
          </button>
        </div>
      </div>
    </article>
  `,
  styles: [`
    :host { display:block; width:100%; height:100%; }
    .storefront-editor-product-details {
      display:grid; grid-template-columns:minmax(0, 1.05fr) minmax(320px, .95fr); gap:32px;
      width:100%; height:100%; padding:24px; box-sizing:border-box; background:#fff; color:#0f172a;
    }
    .storefront-editor-product-details__media { border-radius:24px; background:#f8fafc; overflow:hidden; min-height:320px; display:flex; align-items:center; justify-content:center; }
    .storefront-editor-product-details__media img { width:100%; height:100%; object-fit:cover; display:block; }
    .storefront-editor-product-details__placeholder { font:600 72px/1 Poppins,sans-serif; color:#cbd5e1; }
    .storefront-editor-product-details__content { display:flex; flex-direction:column; gap:18px; }
    .storefront-editor-product-details__eyebrow { font:600 12px/1.2 Poppins,sans-serif; letter-spacing:.14em; text-transform:uppercase; color:#64748b; }
    .storefront-editor-product-details__content h2 { margin:0; font:600 42px/1.02 Poppins,sans-serif; letter-spacing:-.04em; }
    .storefront-editor-product-details__price-row { display:flex; align-items:baseline; gap:12px; }
    .storefront-editor-product-details__price-row strong { font:700 30px/1 Poppins,sans-serif; }
    .storefront-editor-product-details__price-row span { color:#94a3b8; text-decoration:line-through; font:500 18px/1 Poppins,sans-serif; }
    .storefront-editor-product-details__stock { margin:0; font:500 15px/1.4 Poppins,sans-serif; color:#166534; }
    .storefront-editor-product-details__stock--out { color:#b91c1c; }
    .storefront-editor-product-details__description { margin:0; font:400 15px/1.7 Poppins,sans-serif; color:#475569; }
    .storefront-editor-product-details__facts { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; }
    .storefront-editor-product-details__facts div { border:1px solid #e2e8f0; border-radius:16px; padding:14px 16px; display:flex; flex-direction:column; gap:6px; }
    .storefront-editor-product-details__facts span { font:500 12px/1.2 Poppins,sans-serif; text-transform:uppercase; letter-spacing:.08em; color:#94a3b8; }
    .storefront-editor-product-details__facts strong { font:600 14px/1.3 Poppins,sans-serif; color:#0f172a; }
    .storefront-editor-product-details__tags { display:flex; flex-wrap:wrap; gap:8px; }
    .storefront-editor-product-details__tags span { border:1px solid #e2e8f0; border-radius:999px; padding:6px 12px; font:500 12px/1.2 Poppins,sans-serif; color:#334155; }
    .storefront-editor-product-details__quantity { display:flex; flex-direction:column; gap:10px; font:500 15px/1.3 Poppins,sans-serif; color:#475569; }
    .storefront-editor-product-details__stepper { width:max-content; display:flex; align-items:center; gap:28px; border-radius:999px; background:#f8fafc; padding:12px 18px; }
    .storefront-editor-product-details__stepper button { border:0; background:transparent; color:#64748b; font:500 26px/1 Poppins,sans-serif; }
    .storefront-editor-product-details__stepper span { font:500 22px/1 Poppins,sans-serif; color:#0f172a; }
    .storefront-editor-product-details__actions { display:flex; gap:12px; margin-top:auto; }
    .storefront-editor-product-details__actions button { min-height:50px; border-radius:999px; border:1px solid #111827; padding:0 24px; background:#111827; color:#fff; font:600 15px/1 Poppins,sans-serif; }
    .storefront-editor-product-details__actions button[disabled] { cursor:not-allowed; opacity:.45; }
    .storefront-editor-product-details__buy-now { background:#fff !important; color:#111827 !important; }
    @media (max-width: 860px) {
      .storefront-editor-product-details { grid-template-columns:1fr; }
    }
  `],
})
export class StorefrontEditorBlockProductDetailsComponent {
  readonly node = input.required<StorefrontEditorProductDetailsNode>();
  readonly products = input<ProjectCatalogProduct[]>([]);

  readonly product = computed(() => this.products()[0] ?? MOCK_PRODUCT);
  readonly inStock = computed(() => (this.product()?.inventoryQuantity ?? 0) > 0);
}
