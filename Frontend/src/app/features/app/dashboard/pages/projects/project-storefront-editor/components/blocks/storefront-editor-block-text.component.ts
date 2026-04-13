import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';

import { StorefrontEditorTextNode } from '../storefront-editor-component.model';

@Component({
  selector: 'app-storefront-editor-block-text',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="storefront-editor-block-text-shell" dir="ltr" [ngStyle]="textStyles()">
      @if (node().props.richTextHtml) {
        @if (shouldWrapRichTextWithLink()) {
          <a
            class="storefront-editor-block-text storefront-editor-block-text--rich storefront-editor-block-text--link"
            [class.storefront-editor-block-text--interactive]="interactiveLinks()"
            [attr.href]="resolvedHref()"
            [attr.target]="node().props.openInNewTab ? '_blank' : null"
            [attr.rel]="node().props.openInNewTab ? 'noreferrer noopener' : null"
            [innerHTML]="resolvedRichTextHtml()"
            (click)="handleAnchorClick($event)"
          ></a>
        } @else {
          <span
            class="storefront-editor-block-text storefront-editor-block-text--rich"
            [innerHTML]="resolvedRichTextHtml()"
            (click)="handleRichTextClick($event)"
          ></span>
        }
      } @else if (node().props.href) {
        <a
          class="storefront-editor-block-text storefront-editor-block-text--link"
          [class.storefront-editor-block-text--interactive]="interactiveLinks()"
          [attr.href]="resolvedHref()"
          [attr.target]="node().props.openInNewTab ? '_blank' : null"
          [attr.rel]="node().props.openInNewTab ? 'noreferrer noopener' : null"
          (click)="handleAnchorClick($event)"
        >
          {{ node().props.text }}
        </a>
      } @else {
        <span class="storefront-editor-block-text">
          {{ node().props.text }}
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

    .storefront-editor-block-text-shell {
      display: block;
      width: 100%;
      height: 100%;
      background: transparent;
      text-decoration-skip-ink: auto;
      direction: ltr;
      unicode-bidi: plaintext;
      white-space: pre-wrap;
    }

    .storefront-editor-block-text {
      background: transparent;
      color: inherit;
    }

    .storefront-editor-block-text--rich {
      display: block;
      width: 100%;
      white-space: normal;
    }

    .storefront-editor-block-text--link {
      display: inline;
    }

    .storefront-editor-block-text--rich:where(span, a) {
      overflow-wrap: anywhere;
    }

    .storefront-editor-block-text--rich :where(p, ul, ol) {
      margin: 0;
    }

    .storefront-editor-block-text--rich :where(ul, ol) {
      padding-left: 1.2em;
    }

    .storefront-editor-block-text--rich :where(ul) {
      list-style: disc;
    }

    .storefront-editor-block-text--rich :where(ol) {
      list-style: decimal;
    }

    .storefront-editor-block-text--rich :where(li) {
      display: list-item;
    }

    .storefront-editor-block-text--rich :where(a) {
      color: inherit;
    }

    .storefront-editor-block-text--interactive :where(a) {
      cursor: pointer;
    }

    .storefront-editor-block-text--interactive.storefront-editor-block-text--link {
      cursor: pointer;
    }

    .storefront-editor-block-text--rich :where(mark) {
      padding: 0 0.12em;
      border-radius: 0.24em;
    }
  `],
})
export class StorefrontEditorBlockTextComponent {
  readonly node = input.required<StorefrontEditorTextNode>();
  readonly interactiveLinks = input(false);
  readonly linkHrefResolver = input<((value: string) => string) | null>(null);

  readonly textStyles = computed(() => {
    const props = this.node().props;
    const style = props.textStyle;
    const defaultLineHeight =
      style === 'Heading 1' ? 1 :
      style === 'Heading 2' ? 1.04 :
      style === 'Heading 3' ? 1.08 :
      style === 'Heading 4' ? 1.14 :
      style === 'Heading 5' ? 1.2 :
      style === 'Heading 6' ? 1.24 :
      style === 'Paragraph 1' ? 1.55 :
      style === 'Paragraph 2' ? 1.5 :
      1.42;
    const defaultLetterSpacing =
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
      lineHeight: String(props.lineHeight ?? defaultLineHeight),
      letterSpacing: `${props.letterSpacing ?? Number.parseFloat(defaultLetterSpacing)}em`,
    } as Record<string, string>;
  });

  readonly resolvedHref = computed(() => this.resolveHrefValue(this.node().props.href ?? ''));

  readonly richTextContainsAnchors = computed(() => {
    const html = this.node().props.richTextHtml ?? '';
    if (!html) {
      return false;
    }

    const container = document.createElement('div');
    container.innerHTML = html;
    return container.querySelector('a[href]') !== null;
  });

  readonly shouldWrapRichTextWithLink = computed(() => {
    return Boolean(this.node().props.href?.trim()) && !this.richTextContainsAnchors();
  });

  readonly resolvedRichTextHtml = computed(() => {
    const html = this.node().props.richTextHtml ?? '';
    if (!html || !this.interactiveLinks()) {
      return html;
    }

    const container = document.createElement('div');
    container.innerHTML = html;
    for (const anchor of Array.from(container.querySelectorAll('a[href]'))) {
      const href = anchor.getAttribute('href') ?? '';
      anchor.setAttribute('href', this.resolveHrefValue(href));
      if (this.node().props.openInNewTab) {
        anchor.setAttribute('target', '_blank');
        anchor.setAttribute('rel', 'noreferrer noopener');
      }
    }
    return container.innerHTML;
  });

  handleAnchorClick(event: MouseEvent): void {
    if (!this.interactiveLinks()) {
      event.preventDefault();
    }
  }

  handleRichTextClick(event: MouseEvent): void {
    if (this.interactiveLinks()) {
      return;
    }

    const target = event.target;
    if (target instanceof HTMLElement && target.closest('a')) {
      event.preventDefault();
    }
  }

  private resolveHrefValue(value: string): string {
    const href = value.trim();
    if (!href) {
      return '#';
    }

    return this.linkHrefResolver()?.(href) ?? href;
  }
}
