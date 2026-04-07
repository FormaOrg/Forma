import { Component, input } from '@angular/core';

import { StorefrontEditorBlogFeedNode } from './storefront-editor-component.model';

@Component({
  selector: 'app-storefront-editor-block-blog-feed',
  standalone: true,
  template: `
    <span class="storefront-editor-block-blog-feed">
      <span></span>
      <span></span>
      <span></span>
    </span>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }

    .storefront-editor-block-blog-feed {
      width: 100%;
      display: grid;
      gap: 10px;
    }

    .storefront-editor-block-blog-feed span {
      display: block;
      border-radius: 999px;
      background: rgba(24, 38, 60, 0.14);
    }

    .storefront-editor-block-blog-feed span:nth-child(1) {
      width: 74%;
      height: 12px;
    }

    .storefront-editor-block-blog-feed span:nth-child(2) {
      width: 92%;
      height: 12px;
    }

    .storefront-editor-block-blog-feed span:nth-child(3) {
      width: 56%;
      height: 12px;
    }
  `],
})
export class StorefrontEditorBlockBlogFeedComponent {
  readonly node = input.required<StorefrontEditorBlogFeedNode>();
}
