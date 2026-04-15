import { Component, computed, input } from '@angular/core';

import { StorefrontEditorAccountNode } from '../storefront-editor-component.model';

@Component({
  selector: 'app-storefront-editor-block-account',
  standalone: true,
  template: `
    <span class="storefront-editor-block-account" [style.color]="iconColor()">
      <svg viewBox="0 0 24 24" fill="none" width="24" height="24" aria-hidden="true">
        <circle cx="12" cy="8" r="3.25" stroke="currentColor" stroke-width="1.5"></circle>
        <path
          d="M6.5 18.25c0-2.68 2.46-4.75 5.5-4.75s5.5 2.07 5.5 4.75"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
        ></path>
      </svg>
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
      color: #111827;
      user-select: none;
    }

    .storefront-editor-block-account svg {
      display: block;
      width: 24px;
      height: 24px;
      flex: 0 0 auto;
    }
  `],
})
export class StorefrontEditorBlockAccountComponent {
  readonly node = input.required<StorefrontEditorAccountNode>();

  readonly iconColor = computed(() => this.node().props.iconColor || '#111827');
}
