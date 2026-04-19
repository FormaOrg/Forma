import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';

import { ProjectCatalogProduct } from '../../../../../../../core/models/project-catalog.model';
import { Project } from '../../../../../../../core/models/project.model';

import { StorefrontEditorComponentNode } from './storefront-editor-component.model';
import { StorefrontEditorBlockTextComponent } from './blocks/storefront-editor-block-text.component';
import { StorefrontEditorBlockHeadingComponent } from './blocks/storefront-editor-block-heading.component';
import { StorefrontEditorBlockParagraphComponent } from './blocks/storefront-editor-block-paragraph.component';
import { StorefrontEditorBlockImageComponent } from './blocks/storefront-editor-block-image.component';
import { StorefrontEditorBlockButtonComponent } from './blocks/storefront-editor-block-button.component';
import { StorefrontEditorBlockMenuComponent } from './blocks/storefront-editor-block-menu.component';
import { StorefrontEditorBlockSearchComponent } from './blocks/storefront-editor-block-search.component';
import { StorefrontEditorBlockAccountComponent } from './blocks/storefront-editor-block-account.component';
import { StorefrontEditorBlockCartComponent } from './blocks/storefront-editor-block-cart.component';
import { StorefrontEditorBlockIconComponent } from './blocks/storefront-editor-block-icon.component';
import { StorefrontEditorBlockSpacerComponent } from './blocks/storefront-editor-block-spacer.component';
import { StorefrontEditorBlockSocialLinksComponent } from './blocks/storefront-editor-block-social-links.component';
import { StorefrontEditorBlockFaqComponent } from './blocks/storefront-editor-block-faq.component';
import { StorefrontEditorBlockContactFormComponent } from './blocks/storefront-editor-block-contact-form.component';
import { StorefrontEditorBlockTestimonialsComponent } from './blocks/storefront-editor-block-testimonials.component';
import { StorefrontEditorBlockAccountFormComponent } from './blocks/storefront-editor-block-account-form.component';
import { StorefrontEditorBlockCheckoutFormComponent } from './blocks/storefront-editor-block-checkout-form.component';
import { StorefrontEditorBlockContainerComponent } from './blocks/storefront-editor-block-container.component';
import { StorefrontEditorBlockGraphicComponent } from './blocks/storefront-editor-block-graphic.component';
import { StorefrontEditorBlockProductFeedComponent } from './blocks/storefront-editor-block-product-feed.component';
import { StorefrontEditorBlockBlogFeedComponent } from './blocks/storefront-editor-block-blog-feed.component';
import { StorefrontEditorBlockProductDetailsComponent } from './blocks/storefront-editor-block-product-details.component';
import { StorefrontEditorBlockCartContentComponent } from './blocks/storefront-editor-block-cart-content.component';
import { StorefrontPublicAccountFormComponent } from '../../../../../../public-storefront/shared/storefront-public-account-form.component';

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
    StorefrontEditorBlockMenuComponent,
    StorefrontEditorBlockSearchComponent,
    StorefrontEditorBlockAccountComponent,
    StorefrontEditorBlockCartComponent,
    StorefrontEditorBlockIconComponent,
    StorefrontEditorBlockSpacerComponent,
    StorefrontEditorBlockSocialLinksComponent,
    StorefrontEditorBlockFaqComponent,
    StorefrontEditorBlockContactFormComponent,
    StorefrontEditorBlockTestimonialsComponent,
    StorefrontEditorBlockAccountFormComponent,
    StorefrontEditorBlockCheckoutFormComponent,
    StorefrontEditorBlockContainerComponent,
    StorefrontEditorBlockGraphicComponent,
    StorefrontEditorBlockProductFeedComponent,
    StorefrontEditorBlockBlogFeedComponent,
    StorefrontEditorBlockProductDetailsComponent,
    StorefrontEditorBlockCartContentComponent,
    StorefrontPublicAccountFormComponent,
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
        <app-storefront-editor-block-text
          [node]="$any(node())"
          [interactiveLinks]="interactiveLinks()"
          [linkHrefResolver]="linkHrefResolver()"
        />
      }
      @case ('heading') {
        <app-storefront-editor-block-heading [node]="$any(node())" />
      }
      @case ('paragraph') {
        <app-storefront-editor-block-paragraph [node]="$any(node())" />
      }
      @case ('image') {
        <app-storefront-editor-block-image
          [node]="$any(node())"
          [disableCrop]="disableImageCrop()"
          [renderWidth]="renderWidth()"
          [renderHeight]="renderHeight()"
        />
      }
      @case ('button') {
        <app-storefront-editor-block-button [node]="$any(node())" />
      }
      @case ('menu') {
        <app-storefront-editor-block-menu
          [node]="$any(node())"
          [interactiveLinks]="interactiveLinks()"
          [linkHrefResolver]="linkHrefResolver()"
        />
      }
      @case ('search') {
        <app-storefront-editor-block-search [node]="$any(node())" />
      }
      @case ('account') {
        <app-storefront-editor-block-account [node]="$any(node())" />
      }
      @case ('cart') {
        <app-storefront-editor-block-cart [node]="$any(node())" [count]="cartCount()" />
      }
      @case ('icon') {
        <app-storefront-editor-block-icon [node]="$any(node())" />
      }
      @case ('spacer') {
        <app-storefront-editor-block-spacer [node]="$any(node())" />
      }
      @case ('social-links') {
        <app-storefront-editor-block-social-links [node]="$any(node())" [project]="project()" />
      }
      @case ('faq') {
        <app-storefront-editor-block-faq [node]="$any(node())" />
      }
      @case ('contact-form') {
        <app-storefront-editor-block-contact-form [node]="$any(node())" />
      }
      @case ('testimonials') {
        <app-storefront-editor-block-testimonials [node]="$any(node())" />
      }
      @case ('account-form') {
        @if (storefrontProjectId()) {
          <app-storefront-public-account-form
            [node]="$any(node())"
            [projectId]="storefrontProjectId()"
            [isEditorPreview]="storefrontIsEditorPreview()"
            [isDomainRoute]="storefrontIsDomainRoute()"
          />
        } @else {
          <app-storefront-editor-block-account-form [node]="$any(node())" />
        }
      }
      @case ('checkout-form') {
        <app-storefront-editor-block-checkout-form [node]="$any(node())" />
      }
      @case ('container') {
        <app-storefront-editor-block-container [node]="$any(node())" />
      }
      @case ('graphic') {
        <app-storefront-editor-block-graphic [node]="$any(node())" />
      }
      @case ('product-feed') {
        <app-storefront-editor-block-product-feed [node]="$any(node())" [products]="products()" [linkHrefResolver]="linkHrefResolver()" />
      }
      @case ('blog-feed') {
        <app-storefront-editor-block-blog-feed [node]="$any(node())" />
      }
      @case ('product-details') {
        <app-storefront-editor-block-product-details [node]="$any(node())" [products]="products()" />
      }
      @case ('cart-content') {
        <app-storefront-editor-block-cart-content [node]="$any(node())" [products]="products()" />
      }
    }
  `,
})
export class StorefrontEditorComponentHostComponent {
  readonly node = input.required<StorefrontEditorComponentNode>();
  readonly products = input<ProjectCatalogProduct[]>([]);
  readonly project = input<Project | null>(null);
  readonly disableImageCrop = input(false);
  readonly renderWidth = input<number | null>(null);
  readonly renderHeight = input<number | null>(null);
  readonly cartCount = input<number | null>(null);
  readonly interactiveLinks = input(false);
  readonly linkHrefResolver = input<((value: string) => string) | null>(null);
  readonly storefrontProjectId = input<number | null>(null);
  readonly storefrontIsEditorPreview = input(false);
  readonly storefrontIsDomainRoute = input(false);
}
