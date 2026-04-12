import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';

import { ProjectCatalogProduct } from '../../../../../../../core/models/project-catalog.model';

import { StorefrontEditorComponentNode } from './storefront-editor-component.model';
import { StorefrontEditorBlockTextComponent } from './blocks/storefront-editor-block-text.component';
import { StorefrontEditorBlockHeadingComponent } from './blocks/storefront-editor-block-heading.component';
import { StorefrontEditorBlockParagraphComponent } from './blocks/storefront-editor-block-paragraph.component';
import { StorefrontEditorBlockImageComponent } from './blocks/storefront-editor-block-image.component';
import { StorefrontEditorBlockButtonComponent } from './blocks/storefront-editor-block-button.component';
import { StorefrontEditorBlockIconComponent } from './blocks/storefront-editor-block-icon.component';
import { StorefrontEditorBlockSpacerComponent } from './blocks/storefront-editor-block-spacer.component';
import { StorefrontEditorBlockSocialLinksComponent } from './blocks/storefront-editor-block-social-links.component';
import { StorefrontEditorBlockFaqComponent } from './blocks/storefront-editor-block-faq.component';
import { StorefrontEditorBlockContactFormComponent } from './blocks/storefront-editor-block-contact-form.component';
import { StorefrontEditorBlockContainerComponent } from './blocks/storefront-editor-block-container.component';
import { StorefrontEditorBlockGraphicComponent } from './blocks/storefront-editor-block-graphic.component';
import { StorefrontEditorBlockProductFeedComponent } from './blocks/storefront-editor-block-product-feed.component';
import { StorefrontEditorBlockBlogFeedComponent } from './blocks/storefront-editor-block-blog-feed.component';

@Component({
  selector: 'app-storefront-editor-component-host',
  standalone: true,
  imports: [
    CommonModule,
    StorefrontEditorBlockTextComponent,
    StorefrontEditorBlockHeadingComponent,
    StorefrontEditorBlockParagraphComponent,
    StorefrontEditorBlockImageComponent,
    StorefrontEditorBlockButtonComponent,
    StorefrontEditorBlockIconComponent,
    StorefrontEditorBlockSpacerComponent,
    StorefrontEditorBlockSocialLinksComponent,
    StorefrontEditorBlockFaqComponent,
    StorefrontEditorBlockContactFormComponent,
    StorefrontEditorBlockContainerComponent,
    StorefrontEditorBlockGraphicComponent,
    StorefrontEditorBlockProductFeedComponent,
    StorefrontEditorBlockBlogFeedComponent,
  ],
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
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
      @case ('icon') {
        <app-storefront-editor-block-icon [node]="$any(node())" />
      }
      @case ('spacer') {
        <app-storefront-editor-block-spacer [node]="$any(node())" />
      }
      @case ('social-links') {
        <app-storefront-editor-block-social-links [node]="$any(node())" />
      }
      @case ('faq') {
        <app-storefront-editor-block-faq [node]="$any(node())" />
      }
      @case ('contact-form') {
        <app-storefront-editor-block-contact-form [node]="$any(node())" />
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
