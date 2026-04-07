import { Component, input } from '@angular/core';

import { StorefrontEditorProductFeedNode } from './storefront-editor-component.model';

@Component({
  selector: 'app-storefront-editor-block-product-feed',
  standalone: true,
  template: `
    <span class="storefront-editor-block-product-feed">
      <span></span>
      <span></span>
      <span></span>
    </span>
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
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 8px;
    }

    .storefront-editor-block-product-feed span {
      border-radius: 10px;
      background:
        linear-gradient(180deg, rgba(53, 92, 255, 0.12), rgba(53, 92, 255, 0)),
        linear-gradient(180deg, #fff, #edf3ff);
      box-shadow: inset 0 0 0 1px rgba(53, 92, 255, 0.08);
      display: block;
    }
  `],
})
export class StorefrontEditorBlockProductFeedComponent {
  readonly node = input.required<StorefrontEditorProductFeedNode>();
}
