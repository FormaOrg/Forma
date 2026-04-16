import { CommonModule, NgStyle } from '@angular/common';
import { Component, computed, input } from '@angular/core';

import {
  StorefrontEditorCartIconStyle,
  StorefrontEditorCartNode,
} from '../storefront-editor-component.model';

@Component({
  selector: 'app-storefront-editor-block-cart',
  standalone: true,
  imports: [CommonModule, NgStyle],
  template: `
    <span
      class="storefront-editor-block-cart"
      [class.storefront-editor-block-cart--icon-only]="isIconOnly()"
      [class.storefront-editor-block-cart--label-only]="isLabelOnly()"
      [ngStyle]="rootStyles()"
    >
      @switch (styleId()) {
        @case ('bag-filled') {
          <span class="storefront-editor-block-cart__icon-shell storefront-editor-block-cart__icon-shell--badge">
            <span class="storefront-editor-block-cart__icon">
              <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24" aria-hidden="true">
                <path d="M8.5 8.25A3.5 3.5 0 0 1 12 4.75a3.5 3.5 0 0 1 3.5 3.5h1.25c.83 0 1.5.67 1.5 1.5v8.5c0 .83-.67 1.5-1.5 1.5h-9.5c-.83 0-1.5-.67-1.5-1.5v-8.5c0-.83.67-1.5 1.5-1.5H8.5Zm1.5 0h4a2 2 0 0 0-4 0Zm-.5 3a.75.75 0 0 0-1.5 0v1a4 4 0 0 0 8 0v-1a.75.75 0 0 0-1.5 0v1a2.5 2.5 0 0 1-5 0v-1Z"></path>
              </svg>
            </span>
            @if (showBadge()) {
              <span class="storefront-editor-block-cart__badge" [ngStyle]="badgeStyles()">{{ badgeText() }}</span>
            }
          </span>
        }
        @case ('bag-outline') {
          <span class="storefront-editor-block-cart__icon-shell storefront-editor-block-cart__icon-shell--badge">
            <span class="storefront-editor-block-cart__icon storefront-editor-block-cart__icon--outline">
              <svg viewBox="0 0 24 24" fill="none" width="24" height="24" aria-hidden="true">
                <path d="M8.5 8.25A3.5 3.5 0 0 1 12 4.75a3.5 3.5 0 0 1 3.5 3.5h1.25c.83 0 1.5.67 1.5 1.5v8.5c0 .83-.67 1.5-1.5 1.5h-9.5c-.83 0-1.5-.67-1.5-1.5v-8.5c0-.83.67-1.5 1.5-1.5H8.5Zm1.5 0h4a2 2 0 0 0-4 0Zm-.5 3v1a2.5 2.5 0 0 0 5 0v-1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path>
              </svg>
            </span>
            @if (showBadge()) {
              <span class="storefront-editor-block-cart__badge" [ngStyle]="badgeStyles()">{{ badgeText() }}</span>
            }
          </span>
        }
        @case ('basket-outline') {
          <span class="storefront-editor-block-cart__icon-shell storefront-editor-block-cart__icon-shell--badge">
            <span class="storefront-editor-block-cart__icon storefront-editor-block-cart__icon--outline">
              <svg viewBox="0 0 24 24" fill="none" width="24" height="24" aria-hidden="true">
                <path d="m7 10 2 8h6l2-8H7Zm2-2 3-3 3 3M10 12l.7 4M14 12l-.7 4M12 12v4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"></path>
              </svg>
            </span>
            @if (showBadge()) {
              <span class="storefront-editor-block-cart__badge" [ngStyle]="badgeStyles()">{{ badgeText() }}</span>
            }
          </span>
        }
        @case ('cart-outline') {
          <span class="storefront-editor-block-cart__icon-shell storefront-editor-block-cart__icon-shell--badge">
            <span class="storefront-editor-block-cart__icon storefront-editor-block-cart__icon--outline">
              <svg viewBox="0 0 24 24" fill="none" width="24" height="24" aria-hidden="true">
                <path d="M5 6h2l1.4 7.5H17l1.5-5.5H8.2M10 18.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5Zm6 0a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path>
              </svg>
            </span>
            @if (showBadge()) {
              <span class="storefront-editor-block-cart__badge" [ngStyle]="badgeStyles()">{{ badgeText() }}</span>
            }
          </span>
        }
        @case ('text-inline') {
          <span class="storefront-editor-block-cart__text">{{ labelWithInlineCount() }}</span>
        }
        @case ('cart-inline') {
          <span class="storefront-editor-block-cart__icon storefront-editor-block-cart__icon--outline">
            <svg viewBox="0 0 24 24" fill="none" width="24" height="24" aria-hidden="true">
              <path d="M5 6h2l1.4 7.5H17l1.5-5.5H8.2M10 18.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5Zm6 0a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path>
            </svg>
          </span>
          <span class="storefront-editor-block-cart__text">{{ label() }}</span>
          @if (showBadge()) {
            <span class="storefront-editor-block-cart__badge storefront-editor-block-cart__badge--inline" [ngStyle]="badgeStyles()">{{ badgeText() }}</span>
          }
        }
        @case ('badge-only') {
          <span class="storefront-editor-block-cart__badge storefront-editor-block-cart__badge--pill storefront-editor-block-cart__badge--standalone" [ngStyle]="badgeStyles()">{{ badgeText() }}</span>
        }
        @case ('basket-badge') {
          <span class="storefront-editor-block-cart__icon storefront-editor-block-cart__icon--outline">
            <svg viewBox="0 0 24 24" fill="none" width="24" height="24" aria-hidden="true">
              <path d="m7 10 2 8h6l2-8H7Zm2-2 3-3 3 3M10 12l.7 4M14 12l-.7 4M12 12v4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"></path>
            </svg>
          </span>
          @if (showBadge()) {
            <span class="storefront-editor-block-cart__badge storefront-editor-block-cart__badge--inline" [ngStyle]="badgeStyles()">{{ badgeText() }}</span>
          }
        }
        @case ('text-badge') {
          <span class="storefront-editor-block-cart__text storefront-editor-block-cart__text--upper">{{ label() }}</span>
          @if (showBadge()) {
            <span class="storefront-editor-block-cart__badge storefront-editor-block-cart__badge--inline" [ngStyle]="badgeStyles()">{{ badgeText() }}</span>
          }
        }
      }
    </span>
  `,
  styles: [`
    :host {
      display: flex;
      width: 100%;
      height: 100%;
      min-width: 0;
      min-height: 0;
    }

    .storefront-editor-block-cart {
      width: 100%;
      height: 100%;
      min-width: 0;
      min-height: 0;
      box-sizing: border-box;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      color: #2563eb;
      user-select: none;
      white-space: nowrap;
    }

    .storefront-editor-block-cart--icon-only {
      gap: 0;
    }

    .storefront-editor-block-cart__icon-shell {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 24px;
      min-height: 24px;
      color: inherit;
    }

    .storefront-editor-block-cart__icon-shell--badge {
      padding-right: 10px;
    }

    .storefront-editor-block-cart__icon,
    .storefront-editor-block-cart__icon svg {
      display: block;
      width: 24px;
      height: 24px;
      color: inherit;
    }

    .storefront-editor-block-cart__icon--outline svg {
      overflow: visible;
    }

    .storefront-editor-block-cart__text {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      font-size: 1rem;
      line-height: 1;
    }

    .storefront-editor-block-cart__text--upper {
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .storefront-editor-block-cart__badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 18px;
      height: 18px;
      padding: 0 5px;
      border-radius: 999px;
      font-size: 11px;
      line-height: 1;
      box-sizing: border-box;
      flex: 0 0 auto;
    }

    .storefront-editor-block-cart__badge--inline {
      position: static;
    }

    .storefront-editor-block-cart__badge--standalone {
      min-width: 34px;
      height: 34px;
      padding: 0 10px;
      font-size: 16px;
    }

    .storefront-editor-block-cart__icon-shell .storefront-editor-block-cart__badge {
      position: absolute;
      right: 0;
      top: -3px;
    }
  `],
})
export class StorefrontEditorBlockCartComponent {
  readonly node = input.required<StorefrontEditorCartNode>();
  readonly count = input<number | null>(null);

  readonly styleId = computed(() => this.node().props.iconStyle);
  readonly label = computed(() => this.node().props.label?.trim() || 'Cart');
  readonly previewCount = computed(() => {
    const value = this.count();
    if (typeof value === 'number' && Number.isFinite(value)) {
      return Math.max(0, Math.round(value));
    }

    return 1;
  });
  readonly showBadge = computed(() => this.previewCount() > 0 || this.count() === null);
  readonly badgeText = computed(() => String(this.previewCount()));
  readonly isIconOnly = computed(() => {
    const styleId = this.styleId();
    return styleId === 'bag-filled'
      || styleId === 'bag-outline'
      || styleId === 'basket-outline'
      || styleId === 'cart-outline'
      || styleId === 'badge-only'
      || styleId === 'basket-badge';
  });
  readonly isLabelOnly = computed(() => this.styleId() === 'text-inline' || this.styleId() === 'text-badge');

  readonly rootStyles = computed(() => ({
    color: this.node().props.labelColor,
    fontFamily: this.node().props.labelFontFamily,
  }));

  readonly badgeStyles = computed(() => ({
    backgroundColor: this.node().props.badgeBackgroundColor,
    color: this.node().props.badgeTextColor,
    fontFamily: this.node().props.badgeFontFamily,
  }));

  labelWithInlineCount(): string {
    return this.showBadge() ? `${this.label()} (${this.badgeText()})` : this.label();
  }
}
