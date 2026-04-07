import { Component, input } from '@angular/core';

import { StorefrontEditorParagraphNode } from './storefront-editor-component.model';

@Component({
  selector: 'app-storefront-editor-block-paragraph',
  standalone: true,
  template: `<span class="storefront-editor-block-paragraph">{{ node().props.text }}</span>`,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }

    .storefront-editor-block-paragraph {
      display: block;
      width: 100%;
      color: rgba(17, 24, 39, 0.78);
      font-size: 0.9rem;
      line-height: 1.5;
      text-align: var(--storefront-editor-text-align, left);
    }
  `],
})
export class StorefrontEditorBlockParagraphComponent {
  readonly node = input.required<StorefrontEditorParagraphNode>();
}
