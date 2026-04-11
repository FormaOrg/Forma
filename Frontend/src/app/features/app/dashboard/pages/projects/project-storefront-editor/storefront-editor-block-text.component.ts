import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';

import { StorefrontEditorTextNode } from './storefront-editor-component.model';

@Component({
  selector: 'app-storefront-editor-block-text',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (node().props.href) {
      <a
        class="storefront-editor-block-text"
        [attr.href]="node().props.href"
        [attr.target]="node().props.openInNewTab ? '_blank' : null"
        [attr.rel]="node().props.openInNewTab ? 'noreferrer noopener' : null"
        [ngStyle]="textStyles()"
        (click)="$event.preventDefault()"
      >
        {{ node().props.text }}
      </a>
    } @else {
      <span class="storefront-editor-block-text" [ngStyle]="textStyles()">
        {{ node().props.text }}
      </span>
    }
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }

    .storefront-editor-block-text {
      display: block;
      width: 100%;
      height: 100%;
      white-space: pre-wrap;
      background: transparent;
      text-decoration-skip-ink: auto;
    }
  `],
})
export class StorefrontEditorBlockTextComponent {
  readonly node = input.required<StorefrontEditorTextNode>();

  readonly textStyles = computed(() => {
    const props = this.node().props;
    const style = props.textStyle;
    const lineHeight =
      style === 'Heading 1' ? 1 :
      style === 'Heading 2' ? 1.04 :
      style === 'Heading 3' ? 1.08 :
      style === 'Heading 4' ? 1.14 :
      style === 'Heading 5' ? 1.2 :
      style === 'Heading 6' ? 1.24 :
      style === 'Paragraph 1' ? 1.55 :
      style === 'Paragraph 2' ? 1.5 :
      1.42;
    const letterSpacing =
      style === 'Heading 1' ? '-0.06em' :
      style === 'Heading 2' ? '-0.05em' :
      style === 'Heading 3' ? '-0.03em' :
      style.startsWith('Heading') ? '-0.02em' :
      '0';

    return {
      fontFamily: props.fontFamily,
      fontSize: `${props.fontSize}px`,
      fontWeight: String(props.fontWeight),
      fontStyle: props.fontStyle,
      textDecoration: props.textDecoration,
      color: props.color,
      textAlign: props.align,
      lineHeight: String(lineHeight),
      letterSpacing,
    } as Record<string, string>;
  });
}
