import { Component, input } from '@angular/core';

import { StorefrontEditorButtonNode } from './storefront-editor-component.model';

@Component({
  selector: 'app-storefront-editor-block-button',
  standalone: true,
  template: `<span class="storefront-editor-block-button">{{ node().props.label }}</span>`,
  styles: [`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .storefront-editor-block-button {
      min-height: 40px;
      padding: 0 18px;
      border-radius: 12px;
      background: #0f172a;
      color: #fff;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 0.92rem;
      font-weight: 500;
      width: 100%;
    }
  `],
})
export class StorefrontEditorBlockButtonComponent {
  readonly node = input.required<StorefrontEditorButtonNode>();
}
