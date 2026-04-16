import { Component, input } from '@angular/core';

import { StorefrontEditorCheckoutFormNode } from '../storefront-editor-component.model';

@Component({
  selector: 'app-storefront-editor-block-checkout-form',
  standalone: true,
  template: `
    <section class="storefront-editor-block-checkout-form">
      <header class="storefront-editor-block-checkout-form__header">
        <h4>{{ node().props.title }}</h4>
        <p>{{ node().props.description }}</p>
      </header>

      <form class="storefront-editor-block-checkout-form__form" (submit)="preventSubmit($event)">
        <div class="storefront-editor-block-checkout-form__row">
          <label>
            <span>{{ node().props.firstNameLabel }}</span>
            <input type="text" placeholder="Jane" />
          </label>
          <label>
            <span>{{ node().props.lastNameLabel }}</span>
            <input type="text" placeholder="Cooper" />
          </label>
        </div>

        <div class="storefront-editor-block-checkout-form__row">
          <label>
            <span>{{ node().props.phoneLabel }}</span>
            <input type="tel" placeholder="+216 00 000 000" />
          </label>
          <label>
            <span>{{ node().props.emailLabel }}</span>
            <input type="email" placeholder="jane@email.com" />
          </label>
        </div>

        <label class="storefront-editor-block-checkout-form__field">
          <span>{{ node().props.addressLabel }}</span>
          <input type="text" placeholder="Street, city, ZIP" />
        </label>

        <label class="storefront-editor-block-checkout-form__field">
          <span>{{ node().props.notesLabel }}</span>
          <textarea rows="4" placeholder="Optional notes"></textarea>
        </label>

        <button type="submit">{{ node().props.submitLabel }}</button>
      </form>
    </section>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }

    .storefront-editor-block-checkout-form {
      width: 100%;
      height: 100%;
      box-sizing: border-box;
      padding: 24px;
      border-radius: 20px;
      border: 1px solid rgba(148, 163, 184, 0.32);
      background: #ffffff;
      display: grid;
      grid-template-rows: auto minmax(0, 1fr);
      gap: 16px;
      overflow: auto;
    }

    .storefront-editor-block-checkout-form__header h4 {
      margin: 0;
      font: 600 30px/1.1 Poppins, sans-serif;
      color: #0f172a;
      letter-spacing: -0.03em;
    }

    .storefront-editor-block-checkout-form__header p {
      margin: 8px 0 0;
      font: 400 14px/1.5 Poppins, sans-serif;
      color: #64748b;
    }

    .storefront-editor-block-checkout-form__form {
      display: grid;
      gap: 12px;
      align-content: start;
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
      color: #334155;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }

    .storefront-editor-block-checkout-form input,
    .storefront-editor-block-checkout-form textarea {
      width: 100%;
      box-sizing: border-box;
      border: 1px solid rgba(148, 163, 184, 0.4);
      border-radius: 12px;
      background: #ffffff;
      color: #0f172a;
      padding: 0 12px;
      font: 400 14px/1.4 Poppins, sans-serif;
      outline: none;
    }

    .storefront-editor-block-checkout-form input {
      min-height: 42px;
    }

    .storefront-editor-block-checkout-form textarea {
      min-height: 96px;
      padding-top: 10px;
      padding-bottom: 10px;
      resize: none;
    }

    .storefront-editor-block-checkout-form button {
      margin-top: 4px;
      min-height: 44px;
      border: 0;
      border-radius: 12px;
      background: #111827;
      color: #ffffff;
      font: 600 14px/1 Poppins, sans-serif;
    }

    @media (max-width: 680px) {
      .storefront-editor-block-checkout-form__row {
        grid-template-columns: 1fr;
      }
    }
  `],
})
export class StorefrontEditorBlockCheckoutFormComponent {
  readonly node = input.required<StorefrontEditorCheckoutFormNode>();

  preventSubmit(event: Event): void {
    event.preventDefault();
  }
}
