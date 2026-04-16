import { Component, input } from '@angular/core';

import { StorefrontEditorSpacerNode } from '../storefront-editor-component.model';

@Component({
  selector: 'app-storefront-editor-block-spacer',
  standalone: true,
  template: `
    <span class="storefront-editor-block-spacer" [class.storefront-editor-block-spacer--line]="node().props.style === 'line'">
      <span class="storefront-editor-block-spacer__line" [style.--spacer-color]="node().props.lineColor"></span>
      <span class="storefront-editor-block-spacer__dot" [style.background]="node().props.lineColor"></span>
    </span>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }

    .storefront-editor-block-spacer {
      display: flex;
      align-items: center;
      width: 100%;
      height: 100%;
      min-height: 16px;
      gap: 10px;
    }

    .storefront-editor-block-spacer__line,
    .storefront-editor-block-spacer__dot {
      display: none;
    }

    .storefront-editor-block-spacer__line {
      flex: 1;
      height: 1px;
      background: linear-gradient(90deg, transparent, var(--spacer-color), transparent);
      opacity: 0.95;
    }

    .storefront-editor-block-spacer__dot {
      width: 8px;
      height: 8px;
      border-radius: 999px;
      opacity: 0.7;
      box-shadow: 0 0 0 5px color-mix(in srgb, var(--spacer-color) 10%, transparent);
    }

    .storefront-editor-block-spacer--line .storefront-editor-block-spacer__line,
    .storefront-editor-block-spacer--line .storefront-editor-block-spacer__dot {
      display: block;
    }
  `],
})
export class StorefrontEditorBlockSpacerComponent {
  readonly node = input.required<StorefrontEditorSpacerNode>();
}
