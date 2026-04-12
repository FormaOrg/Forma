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
      [class.storefront-editor-block-container--empty]="!node().children.length"
      [class.storefront-editor-block-container--row]="node().props.layout === 'row'"
      [class.storefront-editor-block-container--grid]="node().props.layout === 'grid'"
      [style.gap.px]="node().props.gap"
      [style.padding.px]="node().props.padding"
      [style.background]="node().props.backgroundColor"
      [style.justify-content]="justifyContent()"
      [style.align-items]="alignItems()"
      [style.flex-wrap]="node().props.wrap ? 'wrap' : 'nowrap'"
      [attr.data-editor-container-id]="node().id"
    >
      @if (node().children.length) {
        @for (child of node().children; track child.id) {
          <span class="storefront-editor-block-container__item" [ngStyle]="childStyle(child)">
            <app-storefront-editor-component-host [node]="child" [products]="products()" />
          </span>
        }
      } @else {
        <span class="storefront-editor-block-container__placeholder">
          <strong>{{ node().props.layout === 'row' ? 'Row container' : 'Stack container' }}</strong>
          <small>Drop elements here</small>
        </span>
      }
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
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      align-items: stretch;
      padding: 12px;
      background: transparent;
      box-sizing: border-box;
      overflow: hidden;
    }

    .storefront-editor-block-container--row {
      flex-direction: row;
    }

    .storefront-editor-block-container--grid {
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

    .storefront-editor-block-container__placeholder {
      width: 100%;
      height: 100%;
      min-height: 84px;
      border-radius: 10px;
      background:
        linear-gradient(180deg, rgba(53, 92, 255, 0.08), rgba(53, 92, 255, 0.02));
      color: rgba(17, 24, 39, 0.68);
      display: grid;
      place-items: center;
      text-align: center;
      gap: 4px;
      padding: 16px;
      box-sizing: border-box;
    }

    .storefront-editor-block-container__placeholder strong {
      font-size: 0.88rem;
      font-weight: 600;
    }

    .storefront-editor-block-container__placeholder small {
      font-size: 0.74rem;
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
