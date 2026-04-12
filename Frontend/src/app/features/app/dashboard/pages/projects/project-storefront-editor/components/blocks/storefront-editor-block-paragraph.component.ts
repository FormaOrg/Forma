import { Component, input } from '@angular/core';

import { StorefrontEditorParagraphNode } from '../storefront-editor-component.model';

@Component({
  selector: 'app-storefront-editor-block-paragraph',
  standalone: true,
  template: `
    <span
      class="storefront-editor-block-paragraph"
      [style.font-family]="node().props.fontFamily"
      [style.font-size.px]="node().props.fontSize"
      [style.font-weight]="node().props.fontWeight"
      [style.font-style]="node().props.fontStyle"
      [style.text-decoration]="node().props.textDecoration"
      [style.color]="node().props.color"
      [style.text-align]="node().props.align"
    >
      {{ node().props.text }}
    </span>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }

    .storefront-editor-block-paragraph {
      display: block;
      width: 100%;
      color: rgba(17, 24, 39, 0.78);
      line-height: 1.5;
      white-space: pre-wrap;
    }
  `],
})
export class StorefrontEditorBlockParagraphComponent {
  readonly node = input.required<StorefrontEditorParagraphNode>();
}
