import { Component, computed, input } from '@angular/core';

import { StorefrontEditorAccountNode } from '../storefront-editor-component.model';

@Component({
  selector: 'app-storefront-editor-block-account',
  standalone: true,
  template: `
    <span class="storefront-editor-block-account" [style.--account-icon-size]="iconSizePx()">
      @switch (styleId()) {
        @case ('person-filled') {
          <svg [attr.viewBox]="'0 0 24 24'" fill="none" [attr.width]="iconSize()" [attr.height]="iconSize()" aria-hidden="true">
            <circle cx="12" cy="8" r="3.25" [attr.fill]="iconColor()"></circle>
            <path
              d="M6.5 18.25c0-2.68 2.46-4.75 5.5-4.75s5.5 2.07 5.5 4.75H6.5z"
              [attr.fill]="iconColor()"
            ></path>
          </svg>
        }
        @case ('person-circle-outline') {
          <svg [attr.viewBox]="'0 0 24 24'" fill="none" [attr.width]="iconSize()" [attr.height]="iconSize()" aria-hidden="true">
            <circle cx="12" cy="12" r="10.25" [attr.stroke]="borderColor()" stroke-width="1.5"></circle>
            <circle cx="12" cy="9.5" r="2.5" [attr.stroke]="iconColor()" stroke-width="1.4"></circle>
            <path
              d="M7.5 16c0-2 1.97-3.5 4.5-3.5s4.5 1.5 4.5 3.5"
              [attr.stroke]="iconColor()"
              stroke-width="1.4"
              stroke-linecap="round"
            ></path>
          </svg>
        }
        @case ('person-circle-filled') {
          <svg [attr.viewBox]="'0 0 24 24'" fill="none" [attr.width]="iconSize()" [attr.height]="iconSize()" aria-hidden="true">
            <circle cx="12" cy="12" r="11" [attr.fill]="iconColor()"></circle>
            <circle cx="12" cy="9.5" r="2.5" [attr.fill]="borderColor()"></circle>
            <path
              d="M7.5 16c0-2 1.97-3.5 4.5-3.5s4.5 1.5 4.5 3.5H7.5z"
              [attr.fill]="borderColor()"
            ></path>
          </svg>
        }
        @default {
          <svg [attr.viewBox]="'0 0 24 24'" fill="none" [attr.width]="iconSize()" [attr.height]="iconSize()" aria-hidden="true">
            <circle cx="12" cy="8" r="3.25" [attr.stroke]="iconColor()" stroke-width="1.5"></circle>
            <path
              d="M6.5 18.25c0-2.68 2.46-4.75 5.5-4.75s5.5 2.07 5.5 4.75"
              [attr.stroke]="iconColor()"
              stroke-width="1.5"
              stroke-linecap="round"
            ></path>
          </svg>
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

    .storefront-editor-block-account {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      min-width: 0;
      min-height: 0;
      user-select: none;
    }

    .storefront-editor-block-account svg {
      display: block;
      flex: 0 0 auto;
      width: var(--account-icon-size, 24px);
      height: var(--account-icon-size, 24px);
    }
  `],
})
export class StorefrontEditorBlockAccountComponent {
  readonly node = input.required<StorefrontEditorAccountNode>();

  readonly styleId = computed(() => this.node().props.iconStyle ?? 'person-outline');
  readonly iconColor = computed(() => this.node().props.iconColor || '#111827');
  readonly borderColor = computed(() => this.node().props.borderColor || this.iconColor());
  readonly iconSize = computed(() => {
    const size = this.node().props.iconSize;
    return typeof size === 'number' && size > 0 ? size : 24;
  });
  readonly iconSizePx = computed(() => `${this.iconSize()}px`);
}
