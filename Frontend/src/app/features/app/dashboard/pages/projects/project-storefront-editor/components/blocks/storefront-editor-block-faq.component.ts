import { Component, input, signal } from '@angular/core';

import { AppIcon } from '../../../../../../../../shared/app/icons/app-icon';

import { StorefrontEditorFaqNode } from '../storefront-editor-component.model';

@Component({
  selector: 'app-storefront-editor-block-faq',
  standalone: true,
  imports: [AppIcon],
  template: `
    <section class="storefront-editor-block-faq">
      <header class="storefront-editor-block-faq__header">
        <span class="storefront-editor-block-faq__eyebrow">Support</span>
        <div class="storefront-editor-block-faq__heading-row">
          <h4>{{ node().props.title }}</h4>
          <span class="storefront-editor-block-faq__count">{{ node().props.items.length }} Qs</span>
        </div>
        <p>Answer the questions visitors usually ask before they decide to buy or get in touch.</p>
      </header>
      <div class="storefront-editor-block-faq__items">
        @for (item of node().props.items; track item.question; let index = $index) {
          <article
            class="storefront-editor-block-faq__item"
            [class.storefront-editor-block-faq__item--open]="isOpen(index)"
          >
            <button
              type="button"
              class="storefront-editor-block-faq__trigger"
              (click)="toggle(index)"
              [attr.aria-expanded]="isOpen(index)"
            >
              <span class="storefront-editor-block-faq__question-copy">
                <span class="storefront-editor-block-faq__question-index">
                  {{ index + 1 < 10 ? '0' : '' }}{{ index + 1 }}
                </span>
                <strong>{{ item.question }}</strong>
              </span>
              <span class="storefront-editor-block-faq__icon-shell">
                <app-icon [name]="'chevron-down'" [size]="16" />
              </span>
            </button>
            <div class="storefront-editor-block-faq__answer" [class.storefront-editor-block-faq__answer--open]="isOpen(index)">
              <p>{{ item.answer }}</p>
            </div>
          </article>
        }
      </div>
    </section>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }

    .storefront-editor-block-faq {
      display: grid;
      gap: 18px;
      width: 100%;
      height: 100%;
      padding: 22px;
      border-radius: 26px;
      background:
        radial-gradient(circle at top right, rgba(53, 92, 255, 0.12), transparent 34%),
        radial-gradient(circle at bottom left, rgba(15, 23, 42, 0.05), transparent 28%),
        linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(246, 249, 255, 0.96));
      border: 1px solid rgba(15, 23, 42, 0.07);
      box-shadow: 0 16px 34px rgba(15, 23, 42, 0.08);
      box-sizing: border-box;
      overflow: hidden;
    }

    .storefront-editor-block-faq h4,
    .storefront-editor-block-faq p,
    .storefront-editor-block-faq strong {
      margin: 0;
    }

    .storefront-editor-block-faq__header {
      display: grid;
      gap: 10px;
    }

    .storefront-editor-block-faq__eyebrow {
      display: inline-flex;
      align-items: center;
      justify-self: start;
      min-height: 26px;
      padding: 0 10px;
      border-radius: 999px;
      background: rgba(53, 92, 255, 0.1);
      color: #355cff;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .storefront-editor-block-faq__heading-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .storefront-editor-block-faq h4 {
      font-size: 1.12rem;
      color: #0f172a;
      letter-spacing: -0.03em;
    }

    .storefront-editor-block-faq__count {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 28px;
      padding: 0 10px;
      border-radius: 999px;
      background: rgba(15, 23, 42, 0.06);
      color: rgba(15, 23, 42, 0.62);
      font-size: 0.74rem;
      font-weight: 700;
      white-space: nowrap;
    }

    .storefront-editor-block-faq__header p {
      max-width: 40ch;
      color: #64748b;
      font-size: 0.82rem;
      line-height: 1.55;
    }

    .storefront-editor-block-faq__items {
      display: grid;
      gap: 10px;
    }

    .storefront-editor-block-faq__item {
      display: grid;
      gap: 0;
      border-radius: 18px;
      background: rgba(255, 255, 255, 0.88);
      border: 1px solid rgba(15, 23, 42, 0.08);
      box-shadow: 0 10px 18px rgba(15, 23, 42, 0.05);
      overflow: hidden;
      transition: border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease;
    }

    .storefront-editor-block-faq__item--open {
      border-color: rgba(53, 92, 255, 0.2);
      box-shadow: 0 14px 28px rgba(53, 92, 255, 0.12);
    }

    .storefront-editor-block-faq__trigger {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      width: 100%;
      padding: 15px 16px;
      border: 0;
      background: transparent;
      color: #111827;
      text-align: left;
      font: inherit;
      cursor: pointer;
    }

    .storefront-editor-block-faq__question-copy {
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 0;
      flex: 1 1 auto;
    }

    .storefront-editor-block-faq__question-index {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 30px;
      height: 30px;
      border-radius: 10px;
      background: rgba(15, 23, 42, 0.05);
      color: rgba(15, 23, 42, 0.56);
      font-size: 0.72rem;
      font-weight: 700;
      flex-shrink: 0;
    }

    .storefront-editor-block-faq__trigger strong {
      color: #0f172a;
      font-size: 0.88rem;
      line-height: 1.4;
    }

    .storefront-editor-block-faq__icon-shell {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 30px;
      height: 30px;
      border-radius: 999px;
      background: rgba(53, 92, 255, 0.08);
      color: #355cff;
      flex-shrink: 0;
      transition: transform 160ms ease, background-color 160ms ease;
    }

    .storefront-editor-block-faq__item--open .storefront-editor-block-faq__icon-shell {
      transform: rotate(180deg);
      background: rgba(53, 92, 255, 0.14);
    }

    .storefront-editor-block-faq__answer {
      display: grid;
      grid-template-rows: 0fr;
      transition: grid-template-rows 180ms ease;
    }

    .storefront-editor-block-faq__answer--open {
      grid-template-rows: 1fr;
    }

    .storefront-editor-block-faq__answer p {
      min-height: 0;
      overflow: hidden;
      padding: 0 16px;
      color: #475569;
      font-size: 0.84rem;
      line-height: 1.5;
    }

    .storefront-editor-block-faq__answer--open p {
      padding: 0 16px 16px 58px;
    }
  `],
})
export class StorefrontEditorBlockFaqComponent {
  readonly node = input.required<StorefrontEditorFaqNode>();
  readonly openIndex = signal(0);

  isOpen(index: number): boolean {
    return this.openIndex() === index;
  }

  toggle(index: number): void {
    this.openIndex.update((current) => current === index ? -1 : index);
  }
}
