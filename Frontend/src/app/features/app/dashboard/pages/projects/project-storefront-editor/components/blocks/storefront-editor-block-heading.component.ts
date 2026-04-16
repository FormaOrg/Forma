import { Component, input } from '@angular/core';

import { StorefrontEditorHeadingNode } from '../storefront-editor-component.model';

@Component({
  selector: 'app-storefront-editor-block-heading',
  standalone: true,
  template: `<span class="storefront-editor-block-heading">{{ node().props.text }}</span>`,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }

    .storefront-editor-block-heading {
      display: block;
      width: 100%;
      color: #18263c;
      font-size: 2rem;
      font-weight: 500;
      letter-spacing: -0.06em;
      line-height: 0.96;
      text-align: var(--storefront-editor-text-align, left);
    }
  `],
})
export class StorefrontEditorBlockHeadingComponent {
  readonly node = input.required<StorefrontEditorHeadingNode>();
}
