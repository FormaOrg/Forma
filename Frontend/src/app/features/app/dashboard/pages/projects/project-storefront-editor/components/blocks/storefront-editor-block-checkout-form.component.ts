import { Component, input } from '@angular/core';

import { StorefrontEditorCheckoutFormNode } from '../storefront-editor-component.model';

@Component({
  selector: 'app-storefront-editor-block-checkout-form',
  standalone: true,
  template: `
    <section
      class="storefront-editor-block-checkout-form"
      [style.--checkout-accent]="node().props.accentColor"
      [style.--checkout-background]="node().props.backgroundColor"
      [style.--checkout-panel]="node().props.panelColor"
      [style.--checkout-text]="node().props.textColor"
    >
      <div class="storefront-editor-block-checkout-form__shell">
        <section class="storefront-editor-block-checkout-form__form-card">
          <header class="storefront-editor-block-checkout-form__header">
            <span class="storefront-editor-block-checkout-form__eyebrow">{{ node().props.eyebrow }}</span>
            <h4>{{ node().props.title }}</h4>
            <p>{{ node().props.description }}</p>
          </header>

          <div class="storefront-editor-block-checkout-form__form" aria-hidden="true">
            <div class="storefront-editor-block-checkout-form__row">
              <label>
                <span>{{ node().props.firstNameLabel }}</span>
                <div class="storefront-editor-block-checkout-form__mock-input">
                  {{ node().props.firstNamePlaceholder }}
                </div>
              </label>
              <label>
                <span>{{ node().props.lastNameLabel }}</span>
                <div class="storefront-editor-block-checkout-form__mock-input">
                  {{ node().props.lastNamePlaceholder }}
                </div>
              </label>
            </div>

            <div class="storefront-editor-block-checkout-form__row">
              <label>
                <span>{{ node().props.phoneLabel }}</span>
                <div class="storefront-editor-block-checkout-form__mock-input">
                  {{ node().props.phonePlaceholder }}
                </div>
              </label>
              <label>
                <span>{{ node().props.emailLabel }}</span>
                <div class="storefront-editor-block-checkout-form__mock-input">
                  {{ node().props.emailPlaceholder }}
                </div>
              </label>
            </div>

            <label class="storefront-editor-block-checkout-form__field">
              <span>{{ node().props.addressLabel }}</span>
              <div class="storefront-editor-block-checkout-form__mock-textarea">
                {{ node().props.addressPlaceholder }}
              </div>
            </label>

            @if (node().props.showNotesField) {
              <label class="storefront-editor-block-checkout-form__field">
                <span>{{ node().props.notesLabel }}</span>
                <div class="storefront-editor-block-checkout-form__mock-textarea storefront-editor-block-checkout-form__mock-textarea--notes">
                  {{ node().props.notesPlaceholder }}
                </div>
              </label>
            }

            <div class="storefront-editor-block-checkout-form__footer">
              <div class="storefront-editor-block-checkout-form__mock-button">
                {{ node().props.submitLabel }}
              </div>
              <small>{{ node().props.submitHint }}</small>
            </div>
          </div>
        </section>

        @if (node().props.showSummary) {
          <aside class="storefront-editor-block-checkout-form__summary">
            <h5>{{ node().props.summaryTitle }}</h5>
            <p>{{ node().props.summaryCaption }}</p>

            <div class="storefront-editor-block-checkout-form__summary-items">
              <div class="storefront-editor-block-checkout-form__summary-item">
                <div>
                  <strong>Essential Tee</strong>
                  <span>2 x TND 34.00</span>
                </div>
                <strong>TND 68.00</strong>
              </div>
              <div class="storefront-editor-block-checkout-form__summary-item">
                <div>
                  <strong>Minimal Cap</strong>
                  <span>1 x TND 60.00</span>
                </div>
                <strong>TND 60.00</strong>
              </div>
            </div>

            <div class="storefront-editor-block-checkout-form__summary-total">
              <span>{{ node().props.subtotalLabel }}</span>
              <strong>{{ node().props.totalValue }}</strong>
            </div>
            <div class="storefront-editor-block-checkout-form__summary-total storefront-editor-block-checkout-form__summary-total--grand">
              <span>{{ node().props.totalLabel }}</span>
              <strong>{{ node().props.totalValue }}</strong>
            </div>
          </aside>
        }
      </div>
    </section>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      container-type: size;
    }

    .storefront-editor-block-checkout-form {
      width: 100%;
      height: 100%;
      box-sizing: border-box;
      padding: 24px;
      background: var(--checkout-background, #ffffff);
      color: var(--checkout-text, #0f172a);
      overflow: visible;
    }

    .storefront-editor-block-checkout-form__shell {
      display: grid;
      grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
      gap: 24px;
      min-height: 100%;
      align-items: start;
    }

    .storefront-editor-block-checkout-form__form-card,
    .storefront-editor-block-checkout-form__summary {
      padding: 24px;
      border-radius: 24px;
      background: var(--checkout-panel, #f8fafc);
      border: 1px solid #e2e8f0;
      box-shadow: none;
    }

    .storefront-editor-block-checkout-form__header {
      display: grid;
      gap: 8px;
    }

    .storefront-editor-block-checkout-form__eyebrow {
      font: 600 11px/1.2 Poppins, sans-serif;
      text-transform: uppercase;
      letter-spacing: 0.14em;
      color: #64748b;
    }

    .storefront-editor-block-checkout-form__header h4 {
      margin: 0;
      font: 600 42px/1.02 Poppins, sans-serif;
      color: var(--checkout-text, #0f172a);
      letter-spacing: -0.04em;
    }

    .storefront-editor-block-checkout-form__header p {
      margin: 0;
      font: 400 15px/1.7 Poppins, sans-serif;
      color: #475569;
    }

    .storefront-editor-block-checkout-form__form {
      display: grid;
      gap: 12px;
      align-content: start;
      margin-top: 20px;
    }

    .storefront-editor-block-checkout-form__row {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
    }

    .storefront-editor-block-checkout-form__field {
      display: grid;
      gap: 6px;
    }

    .storefront-editor-block-checkout-form label {
      display: grid;
      gap: 6px;
    }

    .storefront-editor-block-checkout-form label > span {
      font: 600 12px/1.2 Poppins, sans-serif;
      color: #64748b;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .storefront-editor-block-checkout-form__mock-input,
    .storefront-editor-block-checkout-form__mock-textarea {
      width: 100%;
      box-sizing: border-box;
      border: 1px solid #e2e8f0;
      background: #ffffff;
      color: #94a3b8;
      font: 400 14px/1.4 Poppins, sans-serif;
      user-select: none;
    }

    .storefront-editor-block-checkout-form__mock-input {
      display: flex;
      align-items: center;
      min-height: 48px;
      padding: 0 14px;
      border-radius: 16px;
    }

    .storefront-editor-block-checkout-form__mock-textarea {
      min-height: 84px;
      padding: 12px 14px;
      border-radius: 20px;
    }

    .storefront-editor-block-checkout-form__mock-textarea--notes {
      min-height: 96px;
    }

    .storefront-editor-block-checkout-form__footer {
      display: grid;
      gap: 10px;
    }

    .storefront-editor-block-checkout-form__mock-button {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-top: 6px;
      min-height: 50px;
      border-radius: 999px;
      border: 1px solid var(--checkout-accent, #111827);
      background: var(--checkout-accent, #111827);
      color: #ffffff;
      font: 600 15px/1 Poppins, sans-serif;
      padding: 0 24px;
    }

    .storefront-editor-block-checkout-form__footer small {
      font: 400 12px/1.45 Poppins, sans-serif;
      color: #64748b;
    }

    .storefront-editor-block-checkout-form__summary {
      display: grid;
      align-content: start;
      gap: 14px;
      height: fit-content;
    }

    .storefront-editor-block-checkout-form__summary h5 {
      margin: 0;
      font: 600 30px/1.02 Poppins, sans-serif;
      color: var(--checkout-text, #0f172a);
      letter-spacing: -0.03em;
    }

    .storefront-editor-block-checkout-form__summary p {
      margin: 0;
      font: 400 14px/1.6 Poppins, sans-serif;
      color: #475569;
    }

    .storefront-editor-block-checkout-form__summary-items {
      display: grid;
      gap: 10px;
    }

    .storefront-editor-block-checkout-form__summary-item,
    .storefront-editor-block-checkout-form__summary-total {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: flex-start;
    }

    .storefront-editor-block-checkout-form__summary-item div {
      display: grid;
      gap: 3px;
    }

    .storefront-editor-block-checkout-form__summary-item span {
      font: 400 12px/1.4 Poppins, sans-serif;
      color: #64748b;
    }

    .storefront-editor-block-checkout-form__summary-total {
      padding-top: 12px;
      border-top: 1px solid #e2e8f0;
      font: 500 13px/1.4 Poppins, sans-serif;
      color: #475569;
    }

    .storefront-editor-block-checkout-form__summary-total--grand {
      font: 700 15px/1.4 Poppins, sans-serif;
    }

    .storefront-editor-block-checkout-form__summary-total strong,
    .storefront-editor-block-checkout-form__summary-item strong {
      color: var(--checkout-text, #0f172a);
    }

    @container (max-height: 760px) {
      .storefront-editor-block-checkout-form {
        padding: 16px;
      }

      .storefront-editor-block-checkout-form__shell {
        gap: 16px;
      }

      .storefront-editor-block-checkout-form__form-card,
      .storefront-editor-block-checkout-form__summary {
        padding: 18px;
        border-radius: 20px;
      }

      .storefront-editor-block-checkout-form__header {
        gap: 6px;
      }

      .storefront-editor-block-checkout-form__header h4 {
        font-size: 34px;
      }

      .storefront-editor-block-checkout-form__header p,
      .storefront-editor-block-checkout-form__summary p {
        font-size: 13px;
        line-height: 1.5;
      }

      .storefront-editor-block-checkout-form__form {
        gap: 10px;
        margin-top: 16px;
      }

      .storefront-editor-block-checkout-form__mock-input {
        min-height: 44px;
      }

      .storefront-editor-block-checkout-form__mock-textarea {
        min-height: 68px;
        padding-top: 10px;
        padding-bottom: 10px;
      }

      .storefront-editor-block-checkout-form__mock-button {
        min-height: 46px;
        margin-top: 2px;
      }

      .storefront-editor-block-checkout-form__footer {
        gap: 8px;
      }

      .storefront-editor-block-checkout-form__summary {
        gap: 12px;
      }

      .storefront-editor-block-checkout-form__summary h5 {
        font-size: 24px;
      }
    }

    @container (max-height: 680px) {
      .storefront-editor-block-checkout-form {
        padding: 12px;
      }

      .storefront-editor-block-checkout-form__form-card,
      .storefront-editor-block-checkout-form__summary {
        padding: 14px;
        border-radius: 16px;
      }

      .storefront-editor-block-checkout-form__shell {
        gap: 12px;
      }

      .storefront-editor-block-checkout-form__header h4 {
        font-size: 28px;
      }

      .storefront-editor-block-checkout-form__header p,
      .storefront-editor-block-checkout-form__summary p,
      .storefront-editor-block-checkout-form__footer small {
        font-size: 12px;
      }

      .storefront-editor-block-checkout-form__row {
        gap: 10px;
      }

      .storefront-editor-block-checkout-form__mock-input {
        min-height: 40px;
      }

      .storefront-editor-block-checkout-form__mock-textarea {
        min-height: 56px;
      }

      .storefront-editor-block-checkout-form__summary h5 {
        font-size: 22px;
      }
    }

    @container (max-width: 980px) {
      .storefront-editor-block-checkout-form {
        padding: 18px;
      }

      .storefront-editor-block-checkout-form__shell {
        grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.05fr);
        gap: 20px;
      }

      .storefront-editor-block-checkout-form__form-card,
      .storefront-editor-block-checkout-form__summary {
        padding: 18px;
        border-radius: 20px;
      }

      .storefront-editor-block-checkout-form__header h4 {
        font-size: 32px;
      }

      .storefront-editor-block-checkout-form__summary h5 {
        font-size: 24px;
      }
    }

    @container (max-width: 860px) {
      .storefront-editor-block-checkout-form__shell {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
      }

      .storefront-editor-block-checkout-form__summary,
      .storefront-editor-block-checkout-form__form-card {
        width: 100%;
        box-sizing: border-box;
      }

      .storefront-editor-block-checkout-form__summary {
        order: -1;
      }
    }

    @container (max-width: 680px) {
      .storefront-editor-block-checkout-form__row {
        grid-template-columns: 1fr;
      }

      .storefront-editor-block-checkout-form {
        padding: 14px;
        height: auto;
      }

      .storefront-editor-block-checkout-form__form-card,
      .storefront-editor-block-checkout-form__summary {
        padding: 16px;
        border-radius: 16px;
      }

      .storefront-editor-block-checkout-form__header h4 {
        font-size: 26px;
      }

      .storefront-editor-block-checkout-form__summary h5 {
        font-size: 22px;
      }
    }
  `],
})
export class StorefrontEditorBlockCheckoutFormComponent {
  readonly node = input.required<StorefrontEditorCheckoutFormNode>();
}
