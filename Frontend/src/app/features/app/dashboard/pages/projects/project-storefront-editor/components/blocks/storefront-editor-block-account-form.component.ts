import { Component, input } from '@angular/core';

import { StorefrontEditorAccountFormNode } from '../storefront-editor-component.model';

@Component({
  selector: 'app-storefront-editor-block-account-form',
  standalone: true,
  template: `
    <section
      class="storefront-editor-block-account-form"
      [style.--account-form-accent]="node().props.accentColor"
      [style.--account-form-background]="node().props.backgroundColor"
      [style.--account-form-panel]="node().props.panelColor"
      [style.--account-form-text]="node().props.textColor"
    >
      <div class="storefront-editor-block-account-form__shell">
        <section class="storefront-editor-block-account-form__panel">
          <header class="storefront-editor-block-account-form__header">
            <div>
              <span class="storefront-editor-block-account-form__eyebrow">{{ node().props.eyebrow }}</span>
              <h4>{{ node().props.title }}</h4>
              <p>{{ node().props.description }}</p>
            </div>

            <button type="button" disabled>{{ node().props.backButtonLabel }}</button>
          </header>

          <div class="storefront-editor-block-account-form__tabs" aria-hidden="true">
            <button type="button" class="storefront-editor-block-account-form__tab storefront-editor-block-account-form__tab--active" disabled>
              {{ node().props.loginTabLabel }}
            </button>
            @if (node().props.showRegisterTab) {
              <button type="button" class="storefront-editor-block-account-form__tab" disabled>
                {{ node().props.registerTabLabel }}
              </button>
            }
          </div>

          <div class="storefront-editor-block-account-form__forms" aria-hidden="true">
            <section class="storefront-editor-block-account-form__form-card">
              <label>
                <span>{{ node().props.emailLabel }}</span>
                <div class="storefront-editor-block-account-form__mock-input">{{ node().props.loginEmailPlaceholder }}</div>
              </label>
              <label>
                <span>{{ node().props.passwordLabel }}</span>
                <div class="storefront-editor-block-account-form__mock-input">{{ node().props.loginPasswordPlaceholder }}</div>
              </label>
              <div class="storefront-editor-block-account-form__cta">
                {{ node().props.submitLoginLabel }}
              </div>
            </section>
          </div>
        </section>
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

    .storefront-editor-block-account-form {
      width: 100%;
      height: 100%;
      box-sizing: border-box;
      padding: 24px;
      background: var(--account-form-background, #ffffff);
      color: var(--account-form-text, #0f172a);
    }

    .storefront-editor-block-account-form__shell {
      display: block;
      max-width: 720px;
      margin: 0 auto;
      min-height: 100%;
    }

    .storefront-editor-block-account-form__panel,
    .storefront-editor-block-account-form__form-card {
      border: 1px solid #e2e8f0;
      background: var(--account-form-panel, #f8fafc);
      border-radius: 24px;
    }

    .storefront-editor-block-account-form__panel {
      padding: 22px;
      display: grid;
      gap: 16px;
      align-content: start;
    }

    .storefront-editor-block-account-form__header {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      align-items: flex-start;
    }

    .storefront-editor-block-account-form__eyebrow {
      font: 600 11px/1.2 Poppins, sans-serif;
      text-transform: uppercase;
      letter-spacing: 0.14em;
      color: #64748b;
    }

    .storefront-editor-block-account-form__header h4 {
      margin: 8px 0 0;
      font: 600 38px/1.02 Poppins, sans-serif;
      letter-spacing: -0.04em;
      color: var(--account-form-text, #0f172a);
    }

    .storefront-editor-block-account-form__header p {
      margin: 10px 0 0;
      font: 400 14px/1.6 Poppins, sans-serif;
      color: #475569;
      max-width: 520px;
    }

    .storefront-editor-block-account-form__header button,
    .storefront-editor-block-account-form__summary-head button {
      min-height: 40px;
      border-radius: 999px;
      border: 1px solid color-mix(in srgb, var(--account-form-accent, #0f172a) 22%, white);
      background: color-mix(in srgb, var(--account-form-accent, #0f172a) 8%, white);
      color: var(--account-form-accent, #0f172a);
      font: 600 13px/1 Poppins, sans-serif;
      padding: 0 16px;
    }

    .storefront-editor-block-account-form__tabs {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .storefront-editor-block-account-form__tab {
      min-height: 40px;
      border-radius: 999px;
      border: 1px solid #dbe3ee;
      background: #ffffff;
      color: #475569;
      font: 600 13px/1 Poppins, sans-serif;
      padding: 0 16px;
    }

    .storefront-editor-block-account-form__tab--active {
      border-color: var(--account-form-accent, #0f172a);
      background: var(--account-form-accent, #0f172a);
      color: #ffffff;
    }

    .storefront-editor-block-account-form__forms {
      display: grid;
      gap: 16px;
    }

    .storefront-editor-block-account-form__form-card {
      padding: 18px;
      display: grid;
      gap: 12px;
      background: #ffffff;
    }

    .storefront-editor-block-account-form label {
      display: grid;
      gap: 6px;
    }

    .storefront-editor-block-account-form label > span {
      font: 600 11px/1.2 Poppins, sans-serif;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #64748b;
    }

    .storefront-editor-block-account-form__mock-input {
      min-height: 46px;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      background: #ffffff;
      color: #94a3b8;
      font: 400 14px/1.4 Poppins, sans-serif;
      display: flex;
      align-items: center;
      padding: 0 14px;
      box-sizing: border-box;
    }

    .storefront-editor-block-account-form__cta {
      min-height: 46px;
      border-radius: 999px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 18px;
      font: 600 14px/1 Poppins, sans-serif;
    }

    .storefront-editor-block-account-form__cta {
      background: var(--account-form-accent, #0f172a);
      color: #ffffff;
      border: 1px solid var(--account-form-accent, #0f172a);
    }

    @container (max-width: 680px) {
      .storefront-editor-block-account-form {
        padding: 14px;
      }

      .storefront-editor-block-account-form__header {
        flex-direction: column;
      }

      .storefront-editor-block-account-form__header h4 {
        font-size: 28px;
      }
    }
  `],
})
export class StorefrontEditorBlockAccountFormComponent {
  readonly node = input.required<StorefrontEditorAccountFormNode>();
}
