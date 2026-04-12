import { Component, input } from '@angular/core';

import { StorefrontEditorContainerNode } from '../storefront-editor-component.model';

@Component({
  selector: 'app-storefront-editor-block-container',
  standalone: true,
  template: `
    <span class="storefront-editor-block-container">
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

    .storefront-editor-block-container {
      width: 100%;
      height: 100%;
      border: 1px dashed rgba(53, 92, 255, 0.3);
      border-radius: 12px;
      display: grid;
      gap: 8px;
      align-content: start;
      padding: 12px;
      background: var(--storefront-editor-container-bg, transparent);
      box-sizing: border-box;
    }

    .storefront-editor-block-container span {
      display: block;
      border-radius: 999px;
      background: rgba(24, 38, 60, 0.14);
    }

    .storefront-editor-block-container span:nth-child(1) {
      height: 42px;
    }

    .storefront-editor-block-container span:nth-child(2) {
      height: 10px;
      width: 78%;
    }

    .storefront-editor-block-container span:nth-child(3) {
      height: 10px;
      width: 58%;
    }
  `],
})
export class StorefrontEditorBlockContainerComponent {
  readonly node = input.required<StorefrontEditorContainerNode>();
}
