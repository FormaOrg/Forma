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
      [style.background]="node().props.backgroundColor === 'rgba(53, 92, 255, 0.08)' ? 'transparent' : node().props.backgroundColor"
      [style.border-radius.px]="node().props.radius"
      [style.border-color]="node().props.borderWidth > 0 ? node().props.borderColor : 'transparent'"
      [style.border-width.px]="node().props.borderWidth"
    >
      <app-icon [name]="node().props.iconName" [size]="node().props.iconSize" />
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
      border-style: solid;
      box-sizing: border-box;
    }
  `],
})
export class StorefrontEditorBlockIconComponent {
  readonly node = input.required<StorefrontEditorIconNode>();
}
