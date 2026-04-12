import { Component, computed, input } from '@angular/core';

import { AppIcon, AppIconName } from '../../../../../../../../shared/app/icons/app-icon';

import { StorefrontEditorSocialLinksNode } from '../storefront-editor-component.model';

@Component({
  selector: 'app-storefront-editor-block-social-links',
  standalone: true,
  imports: [AppIcon],
  template: `
    <span class="storefront-editor-block-social-links">
      @for (item of socialItems(); track item.key) {
        <span
          class="storefront-editor-block-social-links__item"
          [class.storefront-editor-block-social-links__item--ghost]="node().props.style === 'ghost'"
          [style.color]="node().props.style === 'ghost' ? node().props.color : node().props.color"
          [style.background]="node().props.style === 'ghost' ? 'transparent' : node().props.backgroundColor"
          [style.border-color]="node().props.style === 'ghost' ? 'transparent' : node().props.backgroundColor"
          [attr.aria-label]="item.label"
        >
          <app-icon [name]="item.icon" [size]="18" />
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

    .storefront-editor-block-social-links {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
      height: 100%;
    }

    .storefront-editor-block-social-links__item {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 38px;
      height: 38px;
      padding: 0;
      border: 1px solid transparent;
      border-radius: 12px;
      box-sizing: border-box;
      transition: transform 160ms ease, background-color 160ms ease, border-color 160ms ease, color 160ms ease;
    }

    .storefront-editor-block-social-links__item--ghost {
      background: transparent;
    }

    .storefront-editor-block-social-links__item--ghost app-icon {
      opacity: 0.9;
    }
  `],
})
export class StorefrontEditorBlockSocialLinksComponent {
  readonly node = input.required<StorefrontEditorSocialLinksNode>();

  readonly socialItems = computed(() =>
    this.node().props.labels.map((label) => {
      const key = label.trim().toLowerCase();
      return {
        key,
        label,
        icon: this.resolveSocialIcon(key),
      };
    })
  );

  private resolveSocialIcon(value: string): AppIconName {
    switch (value) {
      case 'instagram':
      case 'ig':
        return 'instagram';
      case 'facebook':
      case 'fb':
        return 'facebook';
      case 'tiktok':
      case 'tt':
      case 'tk':
        return 'tiktok';
      default:
        return 'external-link';
    }
  }
}
