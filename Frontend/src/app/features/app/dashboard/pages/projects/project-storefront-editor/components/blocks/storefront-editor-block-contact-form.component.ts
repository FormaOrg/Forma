import { Component, computed, input, signal } from '@angular/core';

import { AppIcon } from '../../../../../../../../shared/app/icons/app-icon';

import { StorefrontEditorContactFormNode } from '../storefront-editor-component.model';

@Component({
  selector: 'app-storefront-editor-block-contact-form',
  standalone: true,
  imports: [AppIcon],
  template: `
    <section class="storefront-editor-block-contact-form">
      <header class="storefront-editor-block-contact-form__header">
        <span class="storefront-editor-block-contact-form__eyebrow">{{ node().props.eyebrow }}</span>
        <h4>{{ node().props.title }}</h4>
        <p>{{ node().props.description }}</p>

        <div class="storefront-editor-block-contact-form__meta">
          <span>
            <app-icon [name]="'history'" [size]="15" />
            Replies within 1 business day
          </span>
          <span>
            <app-icon [name]="'shield'" [size]="15" />
            Privacy-friendly inquiries
          </span>
        </div>
      </header>

      <form class="storefront-editor-block-contact-form__form" (submit)="submit($event)">
        <label class="storefront-editor-block-contact-form__field">
          <span>Name</span>
          <input
            type="text"
            [value]="name()"
            placeholder="Jane Cooper"
            (input)="name.set(getValue($event))"
          />
        </label>

        <div class="storefront-editor-block-contact-form__row">
          <label class="storefront-editor-block-contact-form__field">
            <span>Email</span>
            <input
              type="email"
              [value]="email()"
              placeholder="jane@studio.com"
              (input)="email.set(getValue($event))"
            />
          </label>

          <label class="storefront-editor-block-contact-form__field">
            <span>Topic</span>
            <select [value]="topic()" (change)="topic.set(getValue($event))">
              <option value="Product question">Product question</option>
              <option value="Wholesale inquiry">Wholesale inquiry</option>
              <option value="Custom order">Custom order</option>
              <option value="Support">Support</option>
            </select>
          </label>
        </div>

        <label class="storefront-editor-block-contact-form__field">
          <span>Message</span>
          <textarea
            rows="4"
            [value]="message()"
            placeholder="Tell us what you need and we’ll get back to you."
            (input)="message.set(getValue($event))"
          ></textarea>
        </label>

        <label class="storefront-editor-block-contact-form__consent">
          <input type="checkbox" [checked]="consent()" (change)="consent.set(getChecked($event))" />
          <span>{{ node().props.consentLabel }}</span>
        </label>

        @if (errorMessage(); as error) {
          <p class="storefront-editor-block-contact-form__status storefront-editor-block-contact-form__status--error">
            {{ error }}
          </p>
        }

        @if (isSubmitted()) {
          <p class="storefront-editor-block-contact-form__status storefront-editor-block-contact-form__status--success">
            {{ node().props.successMessage }}
          </p>
        }

        <div class="storefront-editor-block-contact-form__footer">
          <button type="submit" [disabled]="isSubmitDisabled()">
            @if (isSubmitted()) {
              <app-icon [name]="'cloud-check'" [size]="16" />
            }
            <span>{{ isSubmitted() ? 'Message ready' : node().props.submitLabel }}</span>
          </button>
          <small>No spam, just useful replies.</small>
        </div>
      </form>
    </section>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }

    .storefront-editor-block-contact-form {
      display: grid;
      gap: 18px;
      width: 100%;
      height: 100%;
      padding: 22px;
      border-radius: 28px;
      background:
        radial-gradient(circle at top right, rgba(53, 92, 255, 0.16), transparent 34%),
        radial-gradient(circle at bottom left, rgba(15, 23, 42, 0.08), transparent 30%),
        linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
      border: 1px solid rgba(15, 23, 42, 0.08);
      box-shadow: 0 18px 36px rgba(15, 23, 42, 0.1);
      box-sizing: border-box;
      overflow: hidden;
    }

    .storefront-editor-block-contact-form h4,
    .storefront-editor-block-contact-form p {
      margin: 0;
    }

    .storefront-editor-block-contact-form__header {
      display: grid;
      gap: 10px;
    }

    .storefront-editor-block-contact-form__eyebrow {
      display: inline-flex;
      align-items: center;
      justify-self: start;
      min-height: 28px;
      padding: 0 11px;
      border-radius: 999px;
      background: rgba(53, 92, 255, 0.1);
      color: #355cff;
      font-size: 0.72rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .storefront-editor-block-contact-form h4 {
      font-size: 1.26rem;
      color: #0f172a;
      letter-spacing: -0.04em;
    }

    .storefront-editor-block-contact-form__header p {
      max-width: 48ch;
      color: #64748b;
      font-size: 0.85rem;
      line-height: 1.55;
    }

    .storefront-editor-block-contact-form__meta {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }

    .storefront-editor-block-contact-form__meta span {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      min-height: 32px;
      padding: 0 12px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.78);
      border: 1px solid rgba(15, 23, 42, 0.08);
      color: #475569;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .storefront-editor-block-contact-form__form {
      display: grid;
      gap: 12px;
      min-height: 0;
    }

    .storefront-editor-block-contact-form__row {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
    }

    .storefront-editor-block-contact-form__field {
      display: grid;
      gap: 7px;
    }

    .storefront-editor-block-contact-form__field > span {
      color: #334155;
      font-size: 0.76rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    .storefront-editor-block-contact-form__field input,
    .storefront-editor-block-contact-form__field select,
    .storefront-editor-block-contact-form__field textarea {
      width: 100%;
      border: 1px solid rgba(148, 163, 184, 0.28);
      border-radius: 16px;
      background: rgba(255, 255, 255, 0.9);
      color: #0f172a;
      padding: 0 14px;
      font: inherit;
      font-size: 0.88rem;
      box-sizing: border-box;
      outline: none;
      transition: border-color 160ms ease, box-shadow 160ms ease, background-color 160ms ease;
    }

    .storefront-editor-block-contact-form__field input,
    .storefront-editor-block-contact-form__field select {
      min-height: 44px;
    }

    .storefront-editor-block-contact-form__field textarea {
      min-height: 106px;
      padding-top: 12px;
      padding-bottom: 12px;
      resize: none;
    }

    .storefront-editor-block-contact-form__field input:focus,
    .storefront-editor-block-contact-form__field select:focus,
    .storefront-editor-block-contact-form__field textarea:focus {
      border-color: rgba(53, 92, 255, 0.34);
      box-shadow: 0 0 0 4px rgba(53, 92, 255, 0.12);
      background: #fff;
    }

    .storefront-editor-block-contact-form__consent {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      color: #475569;
      font-size: 0.8rem;
      line-height: 1.45;
    }

    .storefront-editor-block-contact-form__consent input {
      width: 16px;
      height: 16px;
      margin-top: 2px;
      accent-color: #355cff;
      flex-shrink: 0;
    }

    .storefront-editor-block-contact-form__status {
      padding: 10px 12px;
      border-radius: 14px;
      font-size: 0.8rem;
      line-height: 1.45;
    }

    .storefront-editor-block-contact-form__status--error {
      background: rgba(239, 68, 68, 0.08);
      color: #b91c1c;
      border: 1px solid rgba(239, 68, 68, 0.14);
    }

    .storefront-editor-block-contact-form__status--success {
      background: rgba(34, 197, 94, 0.1);
      color: #166534;
      border: 1px solid rgba(34, 197, 94, 0.14);
    }

    .storefront-editor-block-contact-form__footer {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }

    .storefront-editor-block-contact-form__footer button {
      min-height: 46px;
      padding: 0 18px;
      border: 0;
      border-radius: 16px;
      background: linear-gradient(135deg, #355cff, #2447f1);
      color: #fff;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font: inherit;
      font-size: 0.88rem;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 12px 22px rgba(53, 92, 255, 0.2);
      transition: transform 160ms ease, box-shadow 160ms ease, opacity 160ms ease;
    }

    .storefront-editor-block-contact-form__footer button:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 16px 26px rgba(53, 92, 255, 0.24);
    }

    .storefront-editor-block-contact-form__footer button:disabled {
      opacity: 0.72;
      cursor: not-allowed;
      box-shadow: none;
    }

    .storefront-editor-block-contact-form__footer small {
      color: #64748b;
      font-size: 0.76rem;
      font-weight: 600;
    }
  `],
})
export class StorefrontEditorBlockContactFormComponent {
  readonly node = input.required<StorefrontEditorContactFormNode>();

  readonly name = signal('');
  readonly email = signal('');
  readonly topic = signal('Product question');
  readonly message = signal('');
  readonly consent = signal(false);
  readonly errorMessage = signal('');
  readonly isSubmitted = signal(false);

  readonly isSubmitDisabled = computed(() =>
    !this.email().trim() || !this.message().trim() || !this.consent()
  );

  getValue(event: Event): string {
    return (event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null)?.value ?? '';
  }

  getChecked(event: Event): boolean {
    return (event.target as HTMLInputElement | null)?.checked ?? false;
  }

  submit(event: Event): void {
    event.preventDefault();

    if (!this.email().trim()) {
      this.errorMessage.set('Add an email so visitors know where the reply should go.');
      this.isSubmitted.set(false);
      return;
    }

    if (!this.message().trim()) {
      this.errorMessage.set('Write a short message so the request feels complete.');
      this.isSubmitted.set(false);
      return;
    }

    if (!this.consent()) {
      this.errorMessage.set('Ask for consent before sending the inquiry.');
      this.isSubmitted.set(false);
      return;
    }

    this.errorMessage.set('');
    this.isSubmitted.set(true);
  }
}
