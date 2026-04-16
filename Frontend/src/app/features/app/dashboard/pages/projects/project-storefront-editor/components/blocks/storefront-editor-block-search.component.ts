import { Component, computed, input } from '@angular/core';

import { StorefrontEditorSearchNode } from '../storefront-editor-component.model';

@Component({
  selector: 'app-storefront-editor-block-search',
  standalone: true,
  template: `
    <span class="storefront-editor-block-search" [style.color]="iconColor()">
      <svg viewBox="0 0 24 24" fill="none" width="24" height="24" aria-hidden="true">
        <circle cx="11" cy="11" r="6.25" stroke="currentColor" stroke-width="1.5"></circle>
        <path d="M16 16l4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path>
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

    .storefront-editor-block-search {
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

    .storefront-editor-block-search svg {
      display: block;
      width: 24px;
      height: 24px;
      flex: 0 0 auto;
    }
  `],
})
export class StorefrontEditorBlockSearchComponent {
  readonly node = input.required<StorefrontEditorSearchNode>();

  readonly iconColor = computed(() => this.node().props.iconColor || '#111827');
}
