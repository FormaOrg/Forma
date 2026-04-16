import { CommonModule, NgStyle } from '@angular/common';
import { Component, computed, input } from '@angular/core';

import { AppIcon } from '../../../../../../../../shared/app/icons/app-icon';
import { StorefrontEditorButtonNode } from '../storefront-editor-component.model';

@Component({
  selector: 'app-storefront-editor-block-button',
  standalone: true,
  imports: [CommonModule, NgStyle, AppIcon],
  template: `
    <span class="storefront-editor-block-button" [ngStyle]="buttonStyles()">
      @if (showLeadingIcon()) {
        @if (node().props.customIconSrc) {
          <img
            class="storefront-editor-block-button__icon storefront-editor-block-button__icon--image"
            [src]="node().props.customIconSrc!"
            alt=""
          />
        } @else {
          <app-icon
            class="storefront-editor-block-button__icon"
            [name]="node().props.iconName"
            [size]="16"
          ></app-icon>
        }
      }

      @if (node().props.showText) {
        <span class="storefront-editor-block-button__label">{{ node().props.label }}</span>
      }

      @if (showTrailingIcon()) {
        @if (node().props.customIconSrc) {
          <img
            class="storefront-editor-block-button__icon storefront-editor-block-button__icon--image"
            [src]="node().props.customIconSrc!"
            alt=""
          />
        } @else {
          <app-icon
            class="storefront-editor-block-button__icon"
            [name]="node().props.iconName"
            [size]="16"
          ></app-icon>
        }
      }
    </span>
  `,
  styles: [`
    :host {
      display: flex;
      width: 100%;
      height: 100%;
      align-items: stretch;
      justify-content: stretch;
    }

    .storefront-editor-block-button {
      width: 100%;
      height: 100%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      box-sizing: border-box;
      overflow: hidden;
      text-align: center;
      user-select: none;
    }

    .storefront-editor-block-button__label {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .storefront-editor-block-button__icon {
      flex: 0 0 auto;
    }

    .storefront-editor-block-button__icon--image {
      width: 16px;
      height: 16px;
      object-fit: contain;
      display: block;
    }

  `],
})
export class StorefrontEditorBlockButtonComponent {
  readonly node = input.required<StorefrontEditorButtonNode>();

  readonly showLeadingIcon = computed(
    () => this.node().props.showIcon && this.node().props.iconPosition === 'left'
  );

  readonly showTrailingIcon = computed(
    () => this.node().props.showIcon && this.node().props.iconPosition === 'right'
  );

  readonly buttonStyles = computed(() => {
    const props = this.node().props;
    const verticalPadding = Math.max(8, Math.round(props.padding * 0.42));

    return {
      fontFamily: props.fontFamily,
      fontSize: `${props.fontSize}px`,
      fontWeight: String(props.fontWeight),
      fontStyle: props.fontStyle ?? 'normal',
      textDecoration: props.textDecoration ?? 'none',
      lineHeight: String(props.lineHeight ?? 1.5),
      letterSpacing: `${props.letterSpacing ?? 0}em`,
      color: props.textColor,
      background: props.backgroundColor,
      borderStyle: props.borderStyle,
      borderWidth: props.borderStyle === 'none' ? '0px' : `${props.borderWidth}px`,
      borderColor: props.borderStyle === 'none' ? 'transparent' : props.borderColor,
      borderRadius: `${props.radius}px`,
      padding: `${verticalPadding}px ${props.padding}px`,
      boxShadow: this.getShadowValue(props.shadow),
      justifyContent: props.showText ? 'center' : 'center',
    } as Record<string, string>;
  });

  private getShadowValue(shadow: StorefrontEditorButtonNode['props']['shadow']): string {
    switch (shadow) {
      case 'soft':
        return '2px -2px 12px rgba(15, 23, 42, 0.16)';
      case 'medium':
        return '-2px -2px 12px rgba(15, 23, 42, 0.16)';
      case 'bottom':
        return '0 8px 16px rgba(15, 23, 42, 0.18)';
      case 'strong':
        return '0 0 14px rgba(15, 23, 42, 0.26)';
      case 'none':
      default:
        return 'none';
    }
  }
}
