import { CommonModule, NgStyle } from '@angular/common';
import { Component, HostListener, computed, input, signal } from '@angular/core';

import { StorefrontEditorMenuNode } from '../storefront-editor-component.model';

@Component({
  selector: 'app-storefront-editor-block-menu',
  standalone: true,
  imports: [CommonModule, NgStyle],
  template: `
    <span
      class="storefront-editor-block-menu"
      [class.storefront-editor-block-menu--hamburger]="node().props.displayMode === 'hamburger'"
      [class.storefront-editor-block-menu--vertical]="node().props.orientation === 'vertical'"
      [ngStyle]="rootStyles()"
    >
      @if (node().props.displayMode === 'hamburger') {
        <button
          type="button"
          class="storefront-editor-block-menu__hamburger"
          [class.storefront-editor-block-menu__hamburger--active]="isDropdownOpen()"
          [ngStyle]="itemStyles()"
          (click)="toggleDropdown($event)"
          [attr.aria-expanded]="isDropdownOpen()"
          aria-label="Toggle menu"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20" aria-hidden="true">
            <path d="M5 7.25A.75.75 0 0 1 5.75 6.5h12.5a.75.75 0 0 1 0 1.5H5.75A.75.75 0 0 1 5 7.25Zm0 4.75a.75.75 0 0 1 .75-.75h12.5a.75.75 0 0 1 0 1.5H5.75A.75.75 0 0 1 5 12Zm0 4.75a.75.75 0 0 1 .75-.75h12.5a.75.75 0 0 1 0 1.5H5.75A.75.75 0 0 1 5 16.75Z"></path>
          </svg>
        </button>

        @if (showDropdown()) {
          <span
            class="storefront-editor-block-menu__dropdown"
            [class.storefront-editor-block-menu__dropdown--vertical]="node().props.orientation === 'vertical'"
            [style.gap.px]="node().props.spacing"
          >
            @for (item of node().props.items; track item.id) {
              @if (interactiveLinks()) {
                <a
                  class="storefront-editor-block-menu__item storefront-editor-block-menu__item--link"
                  [ngStyle]="itemStyles()"
                  [attr.href]="resolveItemHref(item.href)"
                  [attr.target]="item.openInNewTab ? '_blank' : null"
                  [attr.rel]="item.openInNewTab ? 'noopener noreferrer' : null"
                  (click)="handleItemClick()"
                >
                  {{ item.label }}
                </a>
              } @else {
                <span class="storefront-editor-block-menu__item" [ngStyle]="itemStyles()">{{ item.label }}</span>
              }
            }
          </span>
        }
      } @else {
        <span
          class="storefront-editor-block-menu__items"
          [class.storefront-editor-block-menu__items--vertical]="node().props.orientation === 'vertical'"
          [style.gap.px]="node().props.spacing"
        >
          @for (item of node().props.items; track item.id) {
            @if (interactiveLinks()) {
              <a
                class="storefront-editor-block-menu__item storefront-editor-block-menu__item--link"
                [ngStyle]="itemStyles()"
                [attr.href]="resolveItemHref(item.href)"
                [attr.target]="item.openInNewTab ? '_blank' : null"
                [attr.rel]="item.openInNewTab ? 'noopener noreferrer' : null"
              >
                {{ item.label }}
              </a>
            } @else {
              <span class="storefront-editor-block-menu__item" [ngStyle]="itemStyles()">{{ item.label }}</span>
            }
          }
        </span>
      }
    </span>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }

    .storefront-editor-block-menu {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      min-width: 0;
      min-height: 0;
      box-sizing: border-box;
      padding: 0 12px;
      overflow: visible;
    }

    .storefront-editor-block-menu__items,
    .storefront-editor-block-menu__dropdown {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      min-width: 0;
    }

    .storefront-editor-block-menu__items--vertical,
    .storefront-editor-block-menu__dropdown--vertical {
      flex-direction: column;
      justify-content: center;
      align-items: stretch;
    }

    .storefront-editor-block-menu__item {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 0;
      white-space: nowrap;
      text-decoration: none;
      color: inherit;
      user-select: none;
    }

    .storefront-editor-block-menu__item--link {
      cursor: pointer;
    }

    .storefront-editor-block-menu__hamburger {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border: 0;
      border-radius: inherit;
      background: transparent;
      color: inherit;
      cursor: pointer;
      padding: 0;
    }

    .storefront-editor-block-menu__hamburger--active {
      background: rgba(37, 99, 235, 0.08);
    }

    .storefront-editor-block-menu__dropdown {
      position: absolute;
      top: calc(100% + 10px);
      right: 0;
      width: max-content;
      max-width: min(320px, calc(100vw - 24px));
      padding: 14px 16px;
      border-radius: 18px;
      border: 1px solid rgba(15, 23, 42, 0.12);
      background: #ffffff;
      box-shadow: 0 18px 46px rgba(15, 23, 42, 0.16);
      z-index: 5;
      justify-content: flex-start;
    }

    .storefront-editor-block-menu__dropdown .storefront-editor-block-menu__item {
      justify-content: flex-start;
    }
  `],
})
export class StorefrontEditorBlockMenuComponent {
  readonly node = input.required<StorefrontEditorMenuNode>();
  readonly interactiveLinks = input(false);
  readonly linkHrefResolver = input<((value: string) => string) | null>(null);

  readonly isDropdownOpen = signal(false);

  readonly rootStyles = computed(() => {
    const props = this.node().props;
    return {
      borderStyle: props.borderStyle,
      borderWidth: props.borderStyle === 'none' ? '0px' : `${props.borderWidth}px`,
      borderColor: props.borderStyle === 'none' || props.borderWidth === 0 ? 'transparent' : props.borderColor,
      borderRadius: `${props.radius}px`,
      color: props.textColor,
      fontFamily: props.fontFamily,
      fontSize: `${props.fontSize}px`,
      fontWeight: String(props.fontWeight),
    } as Record<string, string>;
  });

  readonly itemStyles = computed(() => ({
    fontFamily: this.node().props.fontFamily,
    fontSize: `${this.node().props.fontSize}px`,
    fontWeight: String(this.node().props.fontWeight),
    color: this.node().props.textColor,
  }));

  readonly showDropdown = computed(() => this.node().props.displayMode === 'hamburger' && this.isDropdownOpen());

  @HostListener('document:mousedown', ['$event'])
  handleDocumentMouseDown(event: MouseEvent): void {
    if (!this.interactiveLinks()) {
      return;
    }

    const target = event.target;
    if (!(target instanceof Element) || !target.closest('app-storefront-editor-block-menu')) {
      this.isDropdownOpen.set(false);
    }
  }

  toggleDropdown(event: MouseEvent): void {
    if (!this.interactiveLinks()) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    this.isDropdownOpen.update((current) => !current);
  }

  handleItemClick(): void {
    this.isDropdownOpen.set(false);
  }

  resolveItemHref(value: string | null | undefined): string {
    const href = (value ?? '').trim();
    if (!href) {
      return '#';
    }

    return this.linkHrefResolver()?.(href) ?? href;
  }
}
