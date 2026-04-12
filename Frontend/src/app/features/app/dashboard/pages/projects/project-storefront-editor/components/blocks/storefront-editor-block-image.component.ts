import { Component, input } from '@angular/core';

import { StorefrontEditorImageNode } from '../storefront-editor-component.model';

@Component({
  selector: 'app-storefront-editor-block-image',
  standalone: true,
  template: `
    <span class="storefront-editor-block-image">
      @if (node().props.src; as src) {
        <img [src]="src" [alt]="node().props.alt || 'Image'" />
      } @else {
        <span>Image</span>
      }
    </span>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }

    .storefront-editor-block-image {
      width: 100%;
      height: 100%;
      border-radius: 12px;
      background:
        linear-gradient(140deg, rgba(53, 92, 255, 0.18), transparent 45%),
        linear-gradient(180deg, #d8e8ff 0%, #a6c6f4 42%, #9dc7a0 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-weight: 600;
      overflow: hidden;
    }

    .storefront-editor-block-image img {
      width: 100%;
      height: 100%;
      object-fit: var(--storefront-editor-image-fit, cover);
      display: block;
    }
  `],
})
export class StorefrontEditorBlockImageComponent {
  readonly node = input.required<StorefrontEditorImageNode>();
}
