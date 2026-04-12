import { Component, input } from '@angular/core';

import { AppIcon } from '../../../../../../../../shared/app/icons/app-icon';

import { StorefrontEditorIconNode } from '../storefront-editor-component.model';

@Component({
  selector: 'app-storefront-editor-block-icon',
  standalone: true,
  imports: [AppIcon],
  template: `
    <span
      class="storefront-editor-block-icon"
      [style.color]="node().props.color"
      [style.background]="node().props.backgroundColor"
      [style.border-radius.px]="node().props.radius"
      [style.box-shadow]="'inset 0 0 0 1px rgba(53, 92, 255, 0.08), 0 10px 24px rgba(15, 23, 42, 0.06)'"
    >
      <span class="storefront-editor-block-icon__glow"></span>
      <app-icon [name]="node().props.iconName" [size]="30" />
    </span>
  `,
  styles: [`
    :host {
      display: grid;
      width: 100%;
      height: 100%;
      place-items: center;
    }

    .storefront-editor-block-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      position: relative;
      width: 100%;
      height: 100%;
      min-width: 48px;
      min-height: 48px;
      overflow: hidden;
    }

    .storefront-editor-block-icon__glow {
      position: absolute;
      inset: 10% 10% auto auto;
      width: 18px;
      height: 18px;
      border-radius: 999px;
      background: currentColor;
      opacity: 0.12;
      filter: blur(10px);
    }
  `],
})
export class StorefrontEditorBlockIconComponent {
  readonly node = input.required<StorefrontEditorIconNode>();
}
