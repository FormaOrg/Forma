import { Component, input } from '@angular/core';

import { AppIcon, AppIconName } from '../../../../../../../../shared/app/icons/app-icon';

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
      @if (iconLibraryUrl()) {
        <span
          class="storefront-editor-block-icon__image"
          aria-hidden="true"
          [style.width.px]="node().props.iconSize"
          [style.height.px]="node().props.iconSize"
          [style.backgroundColor]="node().props.color"
          [style.maskImage]="iconMaskImage()"
          [style.maskRepeat]="'no-repeat'"
          [style.maskPosition]="'center'"
          [style.maskSize]="'contain'"
          [style.webkitMaskImage]="iconMaskImage()"
          [style.webkitMaskRepeat]="'no-repeat'"
          [style.webkitMaskPosition]="'center'"
          [style.webkitMaskSize]="'contain'"
        ></span>
      } @else {
        <app-icon [name]="builtinIconName()" [size]="node().props.iconSize" />
      }
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

    .storefront-editor-block-icon__image {
      display: block;
      flex: 0 0 auto;
    }
  `],
})
export class StorefrontEditorBlockIconComponent {
  readonly node = input.required<StorefrontEditorIconNode>();

  protected iconLibraryUrl(): string | null {
    return this.node().props.iconLibraryUrl ?? null;
  }

  protected iconMaskImage(): string | null {
    const iconLibraryUrl = this.iconLibraryUrl();
    return iconLibraryUrl ? `url("${iconLibraryUrl}")` : null;
  }

  protected builtinIconName(): AppIconName {
    return (this.node().props.iconName || 'sparkles') as AppIconName;
  }
}
