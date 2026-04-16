import { CommonModule } from '@angular/common';
import { Component, computed, forwardRef, input } from '@angular/core';

import { ProjectCatalogProduct } from '../../../../../../../../core/models/project-catalog.model';

import { StorefrontEditorComponentNode, StorefrontEditorContainerNode } from '../storefront-editor-component.model';
import { StorefrontEditorComponentHostComponent } from '../storefront-editor-component-host.component';

@Component({
  selector: 'app-storefront-editor-block-container',
  standalone: true,
  imports: [CommonModule, forwardRef(() => StorefrontEditorComponentHostComponent)],
  template: `
    <span
      class="storefront-editor-block-container"
      [class.storefront-editor-block-container--row]="node().props.layout === 'row'"
      [class.storefront-editor-block-container--grid]="node().props.layout === 'grid'"
      [style.border-radius.px]="node().props.radius"
    >
      <span
        class="storefront-editor-block-container__surface"
        [style.background]="node().props.backgroundColor"
        [style.opacity]="surfaceOpacity()"
        [style.border-radius.px]="node().props.radius"
        [style.border-width.px]="node().props.borderStyle === 'none' ? 0 : node().props.borderWidth"
        [style.border-style]="node().props.borderWidth === 0 ? 'solid' : node().props.borderStyle"
        [style.border-color]="node().props.borderWidth === 0 || node().props.borderStyle === 'none' ? 'transparent' : node().props.borderColor"
        [style.box-shadow]="surfaceShadow()"
        aria-hidden="true"
      ></span>

      <span
        class="storefront-editor-block-container__content"
        [style.gap.px]="node().props.gap"
        [style.padding.px]="node().props.padding"
      [style.justify-content]="justifyContent()"
      [style.align-items]="alignItems()"
      [style.flex-wrap]="node().props.wrap ? 'wrap' : 'nowrap'"
        [style.border-radius.px]="node().props.radius"
        [attr.data-editor-container-id]="node().id"
      >
        @for (child of node().children; track child.id) {
          <span class="storefront-editor-block-container__item" [ngStyle]="childStyle(child)">
            <app-storefront-editor-component-host [node]="child" [products]="products()" />
          </span>
        }
      </span>
    </span>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }

    .storefront-editor-block-container {
      position: relative;
      width: 100%;
      height: 100%;
      box-sizing: border-box;
      overflow: visible;
    }

    .storefront-editor-block-container__surface {
      position: absolute;
      inset: 0;
      border: 0 solid transparent;
      pointer-events: none;
      box-sizing: border-box;
    }

    .storefront-editor-block-container__content {
      position: relative;
      z-index: 1;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      align-items: stretch;
      box-sizing: border-box;
    }

    .storefront-editor-block-container--row .storefront-editor-block-container__content {
      flex-direction: row;
    }

    .storefront-editor-block-container--grid .storefront-editor-block-container__content {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      align-items: stretch;
    }

    .storefront-editor-block-container__item {
      display: block;
      min-width: 0;
      min-height: 48px;
      box-sizing: border-box;
    }
  `],
})
export class StorefrontEditorBlockContainerComponent {
  readonly node = input.required<StorefrontEditorContainerNode>();
  readonly products = input<ProjectCatalogProduct[]>([]);

  readonly justifyContent = computed(() => {
    switch (this.node().props.justify) {
      case 'center':
        return 'center';
      case 'end':
        return 'flex-end';
      case 'space-between':
        return 'space-between';
      default:
        return 'flex-start';
    }
  });

  readonly alignItems = computed(() => {
    switch (this.node().props.align) {
      case 'center':
        return 'center';
      case 'end':
        return 'flex-end';
      case 'stretch':
        return 'stretch';
      default:
        return 'flex-start';
    }
  });

  readonly surfaceOpacity = computed(() => `${Math.max(0, Math.min(100, Number(this.node().props.opacity ?? 100))) / 100}`);

  readonly surfaceShadow = computed(() => {
    switch (this.node().props.shadow) {
      case 'soft':
        return '2px -2px 14px rgba(15, 23, 42, 0.16)';
      case 'medium':
        return '-2px -2px 14px rgba(15, 23, 42, 0.16)';
      case 'bottom':
        return '0 10px 18px rgba(15, 23, 42, 0.18)';
      case 'strong':
        return '0 0 18px rgba(15, 23, 42, 0.28)';
      case 'none':
      default:
        return 'none';
    }
  });

  childStyle(child: StorefrontEditorComponentNode): Record<string, string> {
    if (this.node().props.layout === 'row') {
      return {
        width: `${Math.max(56, child.frame.width)}px`,
        minHeight: `${Math.max(48, child.frame.height)}px`,
        flex: child.props && 'showFilters' in child.props ? '1 1 220px' : `0 0 ${Math.max(56, child.frame.width)}px`,
      };
    }

    if (this.node().props.layout === 'grid') {
      return {
        minHeight: `${Math.max(56, child.frame.height)}px`,
      };
    }

    return {
      width: '100%',
      minHeight: `${Math.max(48, child.frame.height)}px`,
    };
  }
}
