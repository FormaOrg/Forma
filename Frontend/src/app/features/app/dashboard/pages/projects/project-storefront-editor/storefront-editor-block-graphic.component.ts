import { Component, input } from '@angular/core';

import { StorefrontEditorGraphicNode } from './storefront-editor-component.model';

@Component({
  selector: 'app-storefront-editor-block-graphic',
  standalone: true,
  template: `<span class="storefront-editor-block-graphic"></span>`,
  styles: [`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
    }

    .storefront-editor-block-graphic {
      width: 78px;
      height: 78px;
      border-radius: 24px;
      background:
        radial-gradient(circle at 30% 30%, #fff1, transparent 42%),
        linear-gradient(135deg, #4b6dff, #8db2ff);
      transform: rotate(-14deg);
      display: block;
    }
  `],
})
export class StorefrontEditorBlockGraphicComponent {
  readonly node = input.required<StorefrontEditorGraphicNode>();
}
