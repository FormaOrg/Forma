import { Component, input } from '@angular/core';

import { ProjectCatalogProduct } from '../../../../../../core/models/project-catalog.model';

import { StorefrontEditorComponentNode } from './storefront-editor-component.model';
import { StorefrontEditorBlockTextComponent } from './storefront-editor-block-text.component';
import { StorefrontEditorBlockHeadingComponent } from './storefront-editor-block-heading.component';
import { StorefrontEditorBlockParagraphComponent } from './storefront-editor-block-paragraph.component';
import { StorefrontEditorBlockImageComponent } from './storefront-editor-block-image.component';
import { StorefrontEditorBlockButtonComponent } from './storefront-editor-block-button.component';
import { StorefrontEditorBlockContainerComponent } from './storefront-editor-block-container.component';
import { StorefrontEditorBlockGraphicComponent } from './storefront-editor-block-graphic.component';
import { StorefrontEditorBlockProductFeedComponent } from './storefront-editor-block-product-feed.component';
import { StorefrontEditorBlockBlogFeedComponent } from './storefront-editor-block-blog-feed.component';

@Component({
  selector: 'app-storefront-editor-component-host',
  standalone: true,
  imports: [
    StorefrontEditorBlockTextComponent,
    StorefrontEditorBlockHeadingComponent,
    StorefrontEditorBlockParagraphComponent,
    StorefrontEditorBlockImageComponent,
    StorefrontEditorBlockButtonComponent,
    StorefrontEditorBlockContainerComponent,
    StorefrontEditorBlockGraphicComponent,
    StorefrontEditorBlockProductFeedComponent,
    StorefrontEditorBlockBlogFeedComponent,
  ],
  styles: [`
    :host {
      display: flex;
      width: 100%;
      height: 100%;
      align-items: center;
      justify-content: center;
    }
  `],
  template: `
    @switch (node().type) {
      @case ('text') {
        <app-storefront-editor-block-text [node]="$any(node())" />
      }
      @case ('heading') {
        <app-storefront-editor-block-heading [node]="$any(node())" />
      }
      @case ('paragraph') {
        <app-storefront-editor-block-paragraph [node]="$any(node())" />
      }
      @case ('image') {
        <app-storefront-editor-block-image [node]="$any(node())" />
      }
      @case ('button') {
        <app-storefront-editor-block-button [node]="$any(node())" />
      }
      @case ('container') {
        <app-storefront-editor-block-container [node]="$any(node())" />
      }
      @case ('graphic') {
        <app-storefront-editor-block-graphic [node]="$any(node())" />
      }
      @case ('product-feed') {
        <app-storefront-editor-block-product-feed [node]="$any(node())" [products]="products()" />
      }
      @case ('blog-feed') {
        <app-storefront-editor-block-blog-feed [node]="$any(node())" />
      }
    }
  `,
})
export class StorefrontEditorComponentHostComponent {
  readonly node = input.required<StorefrontEditorComponentNode>();
  readonly products = input<ProjectCatalogProduct[]>([]);
}
