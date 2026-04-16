import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';

import { ProjectCatalogProduct } from '../../../../../../../../core/models/project-catalog.model';
import { StorefrontEditorProductFeedNode } from '../storefront-editor-component.model';

type ProductFeedBadgeTone = 'dark' | 'light';

const MOCK_PRODUCTS: ProjectCatalogProduct[] = [
  {
    id: -1,
    name: 'Street Bomber Jacket',
    description: 'Editor preview item shown while the catalog is still empty.',
    sku: 'MOCK-001',
    category: 'Outerwear',
    productType: 'PHYSICAL',
    status: 'ACTIVE',
    price: 189,
    compareAtPrice: 229,
    inventoryQuantity: 12,
    imageUrl: 'https://res.cloudinary.com/dfml64rbi/image/upload/v1776295037/forma/media/file_i1dfym.jpg',
    tags: ['new', 'streetwear', 'outerwear'],
    readyToPublish: true,
    readinessIssues: [],
    createdAt: null,
    updatedAt: null,
  },
  {
    id: -2,
    name: 'Minimal Cargo Pants',
    description: 'Editor preview item shown while the catalog is still empty.',
    sku: 'MOCK-002',
    category: 'Bottoms',
    productType: 'PHYSICAL',
    status: 'ACTIVE',
    price: 124,
    compareAtPrice: 149,
    inventoryQuantity: 16,
    imageUrl: 'https://res.cloudinary.com/dfml64rbi/image/upload/v1776295033/forma/media/file_gg8xy2.jpg',
    tags: ['best seller', 'utility', 'neutral'],
    readyToPublish: true,
    readinessIssues: [],
    createdAt: null,
    updatedAt: null,
  },
  {
    id: -3,
    name: 'Graphic Heavy Tee',
    description: 'Editor preview item shown while the catalog is still empty.',
    sku: 'MOCK-003',
    category: 'Tops',
    productType: 'PHYSICAL',
    status: 'ACTIVE',
    price: 62,
    compareAtPrice: null,
    inventoryQuantity: 22,
    imageUrl: 'https://res.cloudinary.com/dfml64rbi/image/upload/v1776295030/forma/media/file_hseyjz.jpg',
    tags: ['new arrival', 'graphic', 'cotton'],
    readyToPublish: true,
    readinessIssues: [],
    createdAt: null,
    updatedAt: null,
  },
  {
    id: -4,
    name: 'Washed Denim Overshirt',
    description: 'Editor preview item shown while the catalog is still empty.',
    sku: 'MOCK-004',
    category: 'Layering',
    productType: 'PHYSICAL',
    status: 'ACTIVE',
    price: 148,
    compareAtPrice: 178,
    inventoryQuantity: 9,
    imageUrl: 'https://res.cloudinary.com/dfml64rbi/image/upload/v1776296716/forma/media/file_d8vzsd.jpg',
    tags: ['sale', 'denim', 'layer'],
    readyToPublish: true,
    readinessIssues: [],
    createdAt: null,
    updatedAt: null,
  },
  {
    id: -5,
    name: 'Signature Everyday Hoodie',
    description: 'Editor preview item shown while the catalog is still empty.',
    sku: 'MOCK-005',
    category: 'Essentials',
    productType: 'PHYSICAL',
    status: 'ACTIVE',
    price: 96,
    compareAtPrice: 120,
    inventoryQuantity: 18,
    imageUrl: null,
    tags: ['bestseller', 'essential', 'cozy'],
    readyToPublish: true,
    readinessIssues: [],
    createdAt: null,
    updatedAt: null,
  },
  {
    id: -6,
    name: 'Runner Cap',
    description: 'Editor preview item shown while the catalog is still empty.',
    sku: 'MOCK-006',
    category: 'Accessories',
    productType: 'PHYSICAL',
    status: 'ACTIVE',
    price: 36,
    compareAtPrice: null,
    inventoryQuantity: 30,
    imageUrl: null,
    tags: ['accessory', 'cap', 'new'],
    readyToPublish: true,
    readinessIssues: [],
    createdAt: null,
    updatedAt: null,
  },
  {
    id: -7,
    name: 'Canvas Crossbody Bag',
    description: 'Editor preview item shown while the catalog is still empty.',
    sku: 'MOCK-007',
    category: 'Accessories',
    productType: 'PHYSICAL',
    status: 'ACTIVE',
    price: 88,
    compareAtPrice: 104,
    inventoryQuantity: 14,
    imageUrl: null,
    tags: ['utility', 'bag', 'best seller'],
    readyToPublish: true,
    readinessIssues: [],
    createdAt: null,
    updatedAt: null,
  },
  {
    id: -8,
    name: 'Panel Sneakers',
    description: 'Editor preview item shown while the catalog is still empty.',
    sku: 'MOCK-008',
    category: 'Footwear',
    productType: 'PHYSICAL',
    status: 'ACTIVE',
    price: 154,
    compareAtPrice: 182,
    inventoryQuantity: 11,
    imageUrl: null,
    tags: ['footwear', 'new', 'sport'],
    readyToPublish: true,
    readinessIssues: [],
    createdAt: null,
    updatedAt: null,
  },
];

@Component({
  selector: 'app-storefront-editor-block-product-feed',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="storefront-editor-block-product-feed" [ngClass]="'storefront-editor-block-product-feed--' + node().props.designPreset">
      @if (node().props.showFilters) {
        <aside class="storefront-editor-block-product-feed__filters">
          <div class="storefront-editor-block-product-feed__filters-title">Filter by</div>
          @for (filterLabel of filterLabels; track filterLabel) {
            <div class="storefront-editor-block-product-feed__filter-row">
              <span>{{ filterLabel }}</span>
              <span>+</span>
            </div>
          }
        </aside>
      }

      <div class="storefront-editor-block-product-feed__content">
        @if (node().props.showSort) {
          <div class="storefront-editor-block-product-feed__sort-row">
            <div class="storefront-editor-block-product-feed__sort-trigger">
              <span>Sort by</span>
              <span class="storefront-editor-block-product-feed__sort-trigger-caret">⌄</span>
            </div>
          </div>
        }

        @if (isUsingMockProducts()) {
          <div class="storefront-editor-block-product-feed__editor-note">
            Preview products are shown here until this project has real catalog items.
          </div>
        }

        <div
          class="storefront-editor-block-product-feed__grid"
          [style.--product-feed-columns]="node().props.columns"
          [style.--product-feed-text-color]="node().props.textColor"
        >
          @for (product of visibleProducts(); track product.id) {
            @let productHref = resolveProductHref(product.id);
            @if (productHref) {
              <a
                class="storefront-editor-block-product-feed__card storefront-editor-block-product-feed__card--link"
                [href]="productHref"
              >
                <div
                  class="storefront-editor-block-product-feed__image-wrap"
                  [style.borderRadius.px]="node().props.imageRadius"
                >
                  @if (badgeLabel(product); as badge) {
                    <span
                      class="storefront-editor-block-product-feed__badge"
                      [class.storefront-editor-block-product-feed__badge--light]="badgeTone() === 'light'"
                      [style.background]="node().props.badgeBackgroundColor"
                      [style.color]="node().props.badgeTextColor"
                    >
                      {{ badge }}
                    </span>
                  }

                  @if (product.imageUrl) {
                    <img [src]="product.imageUrl" [alt]="product.name" class="storefront-editor-block-product-feed__image" />
                  } @else {
                    <span class="storefront-editor-block-product-feed__image-empty">{{ initials(product.name) }}</span>
                  }

                  @if (node().props.quickAddStyle === 'overlay') {
                    <span class="storefront-editor-block-product-feed__quick-add">
                      +
                    </span>
                  }
                </div>

                <div class="storefront-editor-block-product-feed__copy">
                  <div class="storefront-editor-block-product-feed__name">{{ product.name }}</div>
                  <div class="storefront-editor-block-product-feed__price-row">
                    @if (node().props.showCompareAtPrice && product.compareAtPrice && product.compareAtPrice > product.price) {
                      <span class="storefront-editor-block-product-feed__compare-price">{{ formatPrice(product.compareAtPrice) }}</span>
                    }
                    <span class="storefront-editor-block-product-feed__price">{{ formatPrice(product.price) }}</span>
                  </div>

                  @if (node().props.showColorDots) {
                    <div class="storefront-editor-block-product-feed__swatches">
                      @for (swatch of colorSwatches(product); track swatch) {
                        <span class="storefront-editor-block-product-feed__swatch" [style.background]="swatch"></span>
                      }
                    </div>
                  }

                  @if (node().props.showAddToCart && node().props.quickAddStyle === 'button') {
                    <div class="storefront-editor-block-product-feed__add-to-cart">
                      <span class="storefront-editor-block-product-feed__add-to-cart-plus">+</span>
                      <span>Add to Cart</span>
                    </div>
                  }
                </div>
              </a>
            } @else {
              <article class="storefront-editor-block-product-feed__card">
                <div
                  class="storefront-editor-block-product-feed__image-wrap"
                  [style.borderRadius.px]="node().props.imageRadius"
                >
                  @if (badgeLabel(product); as badge) {
                    <span
                      class="storefront-editor-block-product-feed__badge"
                      [class.storefront-editor-block-product-feed__badge--light]="badgeTone() === 'light'"
                      [style.background]="node().props.badgeBackgroundColor"
                      [style.color]="node().props.badgeTextColor"
                    >
                      {{ badge }}
                    </span>
                  }

                  @if (product.imageUrl) {
                    <img [src]="product.imageUrl" [alt]="product.name" class="storefront-editor-block-product-feed__image" />
                  } @else {
                    <span class="storefront-editor-block-product-feed__image-empty">{{ initials(product.name) }}</span>
                  }

                  @if (node().props.quickAddStyle === 'overlay') {
                    <span class="storefront-editor-block-product-feed__quick-add">
                      +
                    </span>
                  }
                </div>

                <div class="storefront-editor-block-product-feed__copy">
                  <div class="storefront-editor-block-product-feed__name">{{ product.name }}</div>
                  <div class="storefront-editor-block-product-feed__price-row">
                    @if (node().props.showCompareAtPrice && product.compareAtPrice && product.compareAtPrice > product.price) {
                      <span class="storefront-editor-block-product-feed__compare-price">{{ formatPrice(product.compareAtPrice) }}</span>
                    }
                    <span class="storefront-editor-block-product-feed__price">{{ formatPrice(product.price) }}</span>
                  </div>

                  @if (node().props.showColorDots) {
                    <div class="storefront-editor-block-product-feed__swatches">
                      @for (swatch of colorSwatches(product); track swatch) {
                        <span class="storefront-editor-block-product-feed__swatch" [style.background]="swatch"></span>
                      }
                    </div>
                  }

                  @if (node().props.showAddToCart && node().props.quickAddStyle === 'button') {
                    <div class="storefront-editor-block-product-feed__add-to-cart">
                      <span class="storefront-editor-block-product-feed__add-to-cart-plus">+</span>
                      <span>Add to Cart</span>
                    </div>
                  }
                </div>
              </article>
            }
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }

    .storefront-editor-block-product-feed {
      width: 100%;
      height: 100%;
      display: grid;
      gap: 20px;
      color: var(--product-feed-text-color, #202124);
    }

    .storefront-editor-block-product-feed--filter-gallery {
      grid-template-columns: 128px minmax(0, 1fr);
      align-items: start;
    }

    .storefront-editor-block-product-feed__filters {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding-top: 6px;
    }

    .storefront-editor-block-product-feed__filters-title {
      font-size: 0.95rem;
      font-weight: 500;
    }

    .storefront-editor-block-product-feed__filter-row {
      min-height: 34px;
      padding: 0;
      border: 0;
      border-bottom: 1px solid rgba(17, 24, 39, 0.12);
      background: transparent;
      color: inherit;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font: inherit;
      cursor: default;
    }

    .storefront-editor-block-product-feed__content {
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .storefront-editor-block-product-feed__sort-row {
      display: flex;
      justify-content: flex-end;
    }

    .storefront-editor-block-product-feed__sort-trigger {
      min-width: 110px;
      min-height: 34px;
      padding: 0 12px;
      border: 1px solid rgba(17, 24, 39, 0.18);
      background: transparent;
      color: inherit;
      display: inline-flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      font: inherit;
      font-size: 0.86rem;
      cursor: default;
    }

    .storefront-editor-block-product-feed__grid {
      --product-feed-columns: 4;
      display: grid;
      grid-template-columns: repeat(var(--product-feed-columns), minmax(0, 1fr));
      gap: 16px 14px;
      min-width: 0;
    }

    .storefront-editor-block-product-feed__editor-note {
      padding: 10px 12px;
      border: 1px dashed rgba(17, 24, 39, 0.18);
      background: rgba(248, 250, 252, 0.9);
      color: rgba(32, 33, 36, 0.72);
      font-size: 0.78rem;
      line-height: 1.45;
    }

    .storefront-editor-block-product-feed__card {
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    a.storefront-editor-block-product-feed__card--link {
      text-decoration: none;
      color: inherit;
      cursor: pointer;
    }

    .storefront-editor-block-product-feed__image-wrap {
      position: relative;
      aspect-ratio: 1 / 1;
      overflow: hidden;
      background: transparent;
    }

    .storefront-editor-block-product-feed__image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .storefront-editor-block-product-feed__image-empty {
      width: 100%;
      height: 100%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: rgba(17, 24, 39, 0.38);
      font-size: 1.4rem;
      font-weight: 600;
      letter-spacing: 0.08em;
    }

    .storefront-editor-block-product-feed__badge {
      position: absolute;
      top: 10px;
      left: 10px;
      z-index: 1;
      min-height: 24px;
      padding: 0 10px;
      border-radius: 999px;
      display: inline-flex;
      align-items: center;
      font-size: 0.72rem;
      font-weight: 500;
      line-height: 1;
      box-shadow: 0 2px 8px rgba(15, 23, 42, 0.08);
    }

    .storefront-editor-block-product-feed__badge--light {
      box-shadow: 0 2px 8px rgba(15, 23, 42, 0.05);
    }

    .storefront-editor-block-product-feed__quick-add {
      position: absolute;
      right: 10px;
      bottom: 10px;
      width: 36px;
      height: 36px;
      border: 1px solid rgba(226, 232, 240, 0.98);
      background: rgba(255, 255, 255, 0.98);
      color: inherit;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 1.45rem;
      cursor: default;
      box-shadow: 0 10px 22px rgba(15, 23, 42, 0.12);
    }

    .storefront-editor-block-product-feed__copy {
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .storefront-editor-block-product-feed__name {
      color: inherit;
      font-size: 0.9rem;
      line-height: 1.34;
      word-break: break-word;
    }

    .storefront-editor-block-product-feed__price-row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
      color: inherit;
      font-size: 0.86rem;
    }

    .storefront-editor-block-product-feed__compare-price {
      color: rgba(32, 33, 36, 0.56);
      text-decoration: line-through;
    }

    .storefront-editor-block-product-feed__price {
      color: inherit;
    }

    .storefront-editor-block-product-feed__swatches {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      padding-top: 2px;
    }

    .storefront-editor-block-product-feed__swatch {
      width: 12px;
      height: 12px;
      border-radius: 999px;
      border: 1px solid rgba(203, 213, 225, 0.95);
      box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.28);
    }

    .storefront-editor-block-product-feed__add-to-cart {
      align-self: flex-start;
      min-height: 34px;
      padding: 0 16px;
      border: 1.5px solid rgba(17, 24, 39, 0.4);
      border-radius: 999px;
      background: transparent;
      color: inherit;
      display: inline-flex;
      align-items: center;
      gap: 10px;
      font: inherit;
      cursor: default;
    }

    .storefront-editor-block-product-feed__add-to-cart-plus {
      font-size: 1.2rem;
      line-height: 1;
    }
  `],
})
export class StorefrontEditorBlockProductFeedComponent {
  readonly node = input.required<StorefrontEditorProductFeedNode>();
  readonly products = input<ProjectCatalogProduct[]>([]);
  readonly linkHrefResolver = input<((value: string) => string) | null>(null);

  resolveProductHref(productId: number): string | null {
    const resolver = this.linkHrefResolver();
    if (!resolver || productId < 0) {
      return null;
    }

    return resolver(`/products/${productId}`);
  }

  readonly filterLabels = ['Collection', 'Price', 'Color', 'Size'] as const;
  readonly isUsingMockProducts = computed(() => this.products().every((product) => product.status === 'ARCHIVED'));

  private readonly availableProducts = computed(() => {
    const catalog = this.products().filter((product) => product.status !== 'ARCHIVED');
    return catalog.length ? catalog : MOCK_PRODUCTS;
  });

  readonly visibleProducts = computed(() => {
    const props = this.node().props;
    const category = props.category.trim().toLowerCase();
    const catalog = this.availableProducts();
    const filtered = category && category !== 'all'
      ? catalog.filter((product) => (product.category ?? '').trim().toLowerCase() === category)
      : catalog;

    return (filtered.length ? filtered : catalog).slice(0, Math.max(1, props.limit));
  });

  readonly badgeTone = computed<ProductFeedBadgeTone>(() =>
    this.node().props.badgeBackgroundColor.toLowerCase() === '#ffffff' ? 'light' : 'dark'
  );

  badgeLabel(product: ProjectCatalogProduct): string | null {
    if (!this.node().props.showBadges) {
      return null;
    }

    const normalizedTags = product.tags.map((tag) => tag.trim().toLowerCase());
    if (normalizedTags.includes('new') || normalizedTags.includes('new arrival')) {
      return 'New Arrival';
    }
    if (normalizedTags.includes('best seller') || normalizedTags.includes('bestseller')) {
      return 'Best Seller';
    }
    if (product.compareAtPrice && product.compareAtPrice > product.price) {
      return 'Sale';
    }

    return null;
  }

  colorSwatches(product: ProjectCatalogProduct): string[] {
    const paletteByToken = [
      '#d8e7f2',
      '#f4d9da',
      '#efe9b5',
      '#d7e5df',
      '#ef4444',
      '#7f1d1d',
      '#9fd1ef',
      '#1e4e97',
      '#4f6f56',
      '#a53e52',
    ];
    const tokens = [...product.tags, product.category ?? '', product.name]
      .join(' ')
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(Boolean);
    const unique: string[] = [];

    for (const token of tokens) {
      const hash = [...token].reduce((sum, char) => sum + char.charCodeAt(0), 0);
      const color = paletteByToken[hash % paletteByToken.length];
      if (!unique.includes(color)) {
        unique.push(color);
      }
      if (unique.length === 5) {
        break;
      }
    }

    return unique.slice(0, 5);
  }

  formatPrice(value: number): string {
    return `$${value.toFixed(2)}`;
  }

  initials(name: string): string {
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  }
}
