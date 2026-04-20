import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, DestroyRef, computed, effect, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { PublicStorefrontService } from '../../../core/services/public-storefront.service';
import { PublicStorefrontRouteService } from '../../../core/services/public-storefront-route.service';
import { StoreCartService } from '../../../core/services/store-cart.service';
import { StorefrontCustomerSessionService } from '../../../core/services/storefront-customer-session.service';
import { ToastService } from '../../../core/services/toast.service';
import { StorefrontEditorCheckoutFormNode } from '../../app/dashboard/pages/projects/project-storefront-editor/components/storefront-editor-component.model';
import { PublicStorefrontCustomerAccount } from '../../../core/models/public-storefront.model';

@Component({
  selector: 'app-storefront-public-checkout-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CurrencyPipe],
  template: `
    <section
      class="storefront-public-checkout-form"
      [style.--checkout-accent]="node().props.accentColor"
      [style.--checkout-background]="node().props.backgroundColor"
      [style.--checkout-panel]="node().props.panelColor"
      [style.--checkout-text]="node().props.textColor"
    >
      <div class="storefront-public-checkout-form__shell">
        <section class="storefront-public-checkout-form__form-card">
          <header class="storefront-public-checkout-form__header">
            <span class="storefront-public-checkout-form__eyebrow">{{ node().props.eyebrow }}</span>
            <h4>{{ node().props.title }}</h4>
            <p>{{ node().props.description }}</p>
          </header>

          <form [formGroup]="checkoutForm" (ngSubmit)="submitCheckout()" class="storefront-public-checkout-form__form">
            <div class="storefront-public-checkout-form__row">
              <label>
                <span>{{ node().props.firstNameLabel }}</span>
                <input type="text" formControlName="firstName" [placeholder]="node().props.firstNamePlaceholder" />
              </label>
              <label>
                <span>{{ node().props.lastNameLabel }}</span>
                <input type="text" formControlName="lastName" [placeholder]="node().props.lastNamePlaceholder" />
              </label>
            </div>

            <div class="storefront-public-checkout-form__row">
              <label>
                <span>{{ node().props.phoneLabel }}</span>
                <input type="tel" formControlName="phone" [placeholder]="node().props.phonePlaceholder" />
              </label>
              <label>
                <span>{{ node().props.emailLabel }}</span>
                <input type="email" formControlName="email" [placeholder]="node().props.emailPlaceholder" />
              </label>
            </div>

            <label class="storefront-public-checkout-form__field">
              <span>{{ node().props.addressLabel }}</span>
              <textarea formControlName="address" rows="3" [placeholder]="node().props.addressPlaceholder"></textarea>
            </label>

            @if (node().props.showNotesField) {
              <label class="storefront-public-checkout-form__field">
                <span>{{ node().props.notesLabel }}</span>
                <textarea
                  formControlName="notes"
                  rows="4"
                  [placeholder]="node().props.notesPlaceholder"
                  class="storefront-public-checkout-form__notes"
                ></textarea>
              </label>
            }

            <div class="storefront-public-checkout-form__footer">
              <button
                type="submit"
                class="storefront-public-checkout-form__submit"
                [disabled]="checkoutForm.invalid || isSubmitting() || !items().length"
              >
                {{ isSubmitting() ? 'Placing order...' : node().props.submitLabel }}
              </button>
              <small>{{ node().props.submitHint }}</small>
            </div>
          </form>
        </section>

        @if (node().props.showSummary) {
          <aside class="storefront-public-checkout-form__summary">
            <h5>{{ node().props.summaryTitle }}</h5>
            <p>{{ node().props.summaryCaption }}</p>

            <div class="storefront-public-checkout-form__summary-items">
              @for (item of items(); track item.productId) {
                <div class="storefront-public-checkout-form__summary-item">
                  <div>
                    <strong>{{ item.name }}</strong>
                    <span>{{ item.quantity }} x {{ item.price | currency:'TND':'symbol':'1.0-2' }}</span>
                  </div>
                  <strong>{{ item.price * item.quantity | currency:'TND':'symbol':'1.0-2' }}</strong>
                </div>
              }
            </div>

            <div class="storefront-public-checkout-form__summary-total">
              <span>{{ node().props.subtotalLabel }}</span>
              <strong>{{ subtotal() | currency:'TND':'symbol':'1.0-2' }}</strong>
            </div>
            <div class="storefront-public-checkout-form__summary-total storefront-public-checkout-form__summary-total--grand">
              <span>{{ node().props.totalLabel }}</span>
              <strong>{{ subtotal() | currency:'TND':'symbol':'1.0-2' }}</strong>
            </div>
          </aside>
        }
      </div>
    </section>
  `,
  styles: [`
    :host { display:block; width:100%; height:100%; container-type:size; }
    .storefront-public-checkout-form { width:100%; height:100%; box-sizing:border-box; padding:16px; background:var(--checkout-background, #ffffff); color:var(--checkout-text, #0f172a); overflow:hidden; }
    .storefront-public-checkout-form__shell { display:grid; grid-template-columns:minmax(0, 1.05fr) minmax(280px, 0.95fr); gap:16px; min-height:100%; height:100%; align-items:stretch; }
    .storefront-public-checkout-form__form-card, .storefront-public-checkout-form__summary { padding:18px; border-radius:20px; background:var(--checkout-panel, #f8fafc); border:1px solid #e2e8f0; box-shadow:none; min-height:0; }
    .storefront-public-checkout-form__header { display:grid; gap:8px; }
    .storefront-public-checkout-form__eyebrow { font:600 11px/1.2 Poppins,sans-serif; text-transform:uppercase; letter-spacing:.14em; color:#64748b; }
    .storefront-public-checkout-form__header h4 { margin:0; font:600 34px/1.02 Poppins,sans-serif; color:var(--checkout-text, #0f172a); letter-spacing:-.04em; }
    .storefront-public-checkout-form__header p { margin:0; font:400 14px/1.6 Poppins,sans-serif; color:#475569; }
    .storefront-public-checkout-form__form { display:grid; gap:10px; align-content:start; margin-top:16px; min-height:0; overflow:auto; padding-right:4px; }
    .storefront-public-checkout-form__row { display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:10px; }
    .storefront-public-checkout-form__field, .storefront-public-checkout-form label { display:grid; gap:6px; }
    .storefront-public-checkout-form label > span { font:600 12px/1.2 Poppins,sans-serif; color:#64748b; letter-spacing:.08em; text-transform:uppercase; }
    .storefront-public-checkout-form input, .storefront-public-checkout-form textarea {
      width:100%; box-sizing:border-box; border:1px solid #e2e8f0; background:#ffffff; color:#0f172a; font:400 14px/1.4 Poppins,sans-serif;
      border-radius:16px; padding:10px 14px; outline:none;
    }
    .storefront-public-checkout-form textarea { min-height:64px; resize:none; border-radius:20px; }
    .storefront-public-checkout-form__notes { min-height:72px; }
    .storefront-public-checkout-form__footer { display:grid; gap:8px; }
    .storefront-public-checkout-form__submit { display:flex; align-items:center; justify-content:center; margin-top:2px; min-height:46px; border-radius:999px; border:1px solid var(--checkout-accent, #111827); background:var(--checkout-accent, #111827); color:#ffffff; font:600 14px/1 Poppins,sans-serif; padding:0 20px; cursor:pointer; }
    .storefront-public-checkout-form__submit[disabled] { cursor:not-allowed; opacity:.45; }
    .storefront-public-checkout-form__footer small { font:400 12px/1.45 Poppins,sans-serif; color:#64748b; }
    .storefront-public-checkout-form__summary { display:grid; align-content:start; gap:12px; height:100%; overflow:auto; }
    .storefront-public-checkout-form__summary h5 { margin:0; font:600 24px/1.02 Poppins,sans-serif; color:var(--checkout-text, #0f172a); letter-spacing:-.03em; }
    .storefront-public-checkout-form__summary p { margin:0; font:400 13px/1.55 Poppins,sans-serif; color:#475569; }
    .storefront-public-checkout-form__summary-items { display:grid; gap:8px; }
    .storefront-public-checkout-form__summary-item, .storefront-public-checkout-form__summary-total { display:flex; justify-content:space-between; gap:12px; align-items:flex-start; }
    .storefront-public-checkout-form__summary-item div { display:grid; gap:3px; }
    .storefront-public-checkout-form__summary-item span { font:400 12px/1.4 Poppins,sans-serif; color:#64748b; }
    .storefront-public-checkout-form__summary-total { padding-top:10px; border-top:1px solid #e2e8f0; font:500 13px/1.4 Poppins,sans-serif; color:#475569; }
    .storefront-public-checkout-form__summary-total--grand { font:700 15px/1.4 Poppins,sans-serif; }
    .storefront-public-checkout-form__summary-total strong, .storefront-public-checkout-form__summary-item strong { color:var(--checkout-text, #0f172a); }
    @container (max-height: 760px) {
      .storefront-public-checkout-form { padding:12px; }
      .storefront-public-checkout-form__shell { gap:12px; }
      .storefront-public-checkout-form__form-card, .storefront-public-checkout-form__summary { padding:14px; border-radius:16px; }
      .storefront-public-checkout-form__header { gap:6px; }
      .storefront-public-checkout-form__header h4 { font-size:28px; }
      .storefront-public-checkout-form__header p, .storefront-public-checkout-form__summary p { font-size:12px; line-height:1.45; }
      .storefront-public-checkout-form__form { gap:8px; margin-top:12px; }
      .storefront-public-checkout-form input { min-height:40px; }
      .storefront-public-checkout-form textarea { min-height:52px; padding-top:8px; padding-bottom:8px; }
      .storefront-public-checkout-form__notes { min-height:60px; }
      .storefront-public-checkout-form__submit { min-height:42px; }
      .storefront-public-checkout-form__footer { gap:6px; }
      .storefront-public-checkout-form__summary { gap:10px; }
      .storefront-public-checkout-form__summary h5 { font-size:24px; }
    }
    @container (max-height: 680px) {
      .storefront-public-checkout-form { padding:10px; }
      .storefront-public-checkout-form__form-card, .storefront-public-checkout-form__summary { padding:12px; border-radius:14px; }
      .storefront-public-checkout-form__shell { gap:10px; }
      .storefront-public-checkout-form__header h4 { font-size:24px; }
      .storefront-public-checkout-form__header p, .storefront-public-checkout-form__summary p, .storefront-public-checkout-form__footer small { font-size:11px; }
      .storefront-public-checkout-form__row { gap:8px; }
      .storefront-public-checkout-form input { min-height:36px; padding-top:8px; padding-bottom:8px; }
      .storefront-public-checkout-form textarea { min-height:48px; }
      .storefront-public-checkout-form__notes { min-height:54px; }
      .storefront-public-checkout-form__summary h5 { font-size:22px; }
    }
    @container (max-width: 980px) {
      .storefront-public-checkout-form { padding:14px; }
      .storefront-public-checkout-form__shell { grid-template-columns:minmax(0, 0.95fr) minmax(0, 1.05fr); gap:16px; }
      .storefront-public-checkout-form__form-card, .storefront-public-checkout-form__summary { padding:16px; border-radius:18px; }
      .storefront-public-checkout-form__header h4 { font-size:32px; }
      .storefront-public-checkout-form__summary h5 { font-size:24px; }
    }
    @container (max-width: 860px) {
      .storefront-public-checkout-form__shell { display:flex; flex-wrap:wrap; gap:16px; }
      .storefront-public-checkout-form__summary, .storefront-public-checkout-form__form-card { width:100%; box-sizing:border-box; }
      .storefront-public-checkout-form__summary { order:-1; }
    }
    @container (max-width: 680px) {
      .storefront-public-checkout-form__row { grid-template-columns:1fr; }
      .storefront-public-checkout-form { padding:12px; height:auto; overflow:visible; }
      .storefront-public-checkout-form__form-card, .storefront-public-checkout-form__summary { padding:14px; border-radius:16px; }
      .storefront-public-checkout-form__header h4 { font-size:26px; }
      .storefront-public-checkout-form__summary h5 { font-size:22px; }
    }
  `],
})
export class StorefrontPublicCheckoutFormComponent {
  private readonly accountCachePrefix = 'forma_storefront_customer_account_';
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);
  private readonly publicStorefrontService = inject(PublicStorefrontService);
  private readonly storefrontRouteService = inject(PublicStorefrontRouteService);
  private readonly storeCartService = inject(StoreCartService);
  private readonly storefrontCustomerSessionService = inject(StorefrontCustomerSessionService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  readonly node = input.required<StorefrontEditorCheckoutFormNode>();
  readonly storefrontProjectId = input.required<number>();
  readonly storefrontIsEditorPreview = input(false);
  readonly storefrontIsDomainRoute = input(false);

  readonly isSubmitting = signal(false);
  readonly hydratedSessionToken = signal<string | null>(null);
  readonly items = computed(() => this.storeCartService.itemsFor(this.storefrontProjectId()));
  readonly subtotal = computed(() => this.storeCartService.subtotalFor(this.storefrontProjectId()));

  readonly checkoutForm = this.formBuilder.nonNullable.group({
    firstName: this.formBuilder.control('', [Validators.required, Validators.maxLength(120)]),
    lastName: this.formBuilder.control('', [Validators.required, Validators.maxLength(120)]),
    phone: this.formBuilder.control('', [Validators.required, Validators.maxLength(40)]),
    email: this.formBuilder.control('', [Validators.email, Validators.maxLength(255)]),
    address: this.formBuilder.control('', [Validators.required, Validators.maxLength(255)]),
    notes: this.formBuilder.control('', [Validators.maxLength(1000)]),
  });

  constructor() {
    effect(() => {
      const projectId = this.storefrontProjectId();
      if (!projectId) {
        this.hydratedSessionToken.set(null);
        return;
      }

      const sessionToken = this.storefrontCustomerSessionService.getSessionToken(projectId);
      if (!sessionToken) {
        this.hydratedSessionToken.set(null);
        return;
      }

      if (this.hydratedSessionToken() === sessionToken) {
        return;
      }

      this.hydratedSessionToken.set(sessionToken);
      this.hydrateCheckoutPrefill(projectId, sessionToken);
    });
  }

  submitCheckout(): void {
    if (this.checkoutForm.invalid || this.isSubmitting() || !this.items().length) {
      this.checkoutForm.markAllAsTouched();
      return;
    }

    const raw = this.checkoutForm.getRawValue();
    const customerSessionToken = this.storefrontCustomerSessionService.getSessionToken(this.storefrontProjectId());

    this.isSubmitting.set(true);
    this.publicStorefrontService
      .checkout(this.storefrontProjectId(), {
        firstName: (raw.firstName ?? '').trim(),
        lastName: (raw.lastName ?? '').trim(),
        phone: (raw.phone ?? '').trim(),
        email: (raw.email ?? '').trim() || null,
        address: (raw.address ?? '').trim(),
        notes: (raw.notes ?? '').trim() || null,
        customerSessionToken,
        items: this.items().map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      })
      .subscribe({
        next: (response) => {
          this.storeCartService.clear(this.storefrontProjectId());
          void this.router.navigateByUrl(
            this.storefrontRouteService.buildUrl(
              this.storefrontProjectId(),
              this.storefrontIsDomainRoute() ? 'domain' : 'path',
              'checkout/success',
              {
                ...(this.storefrontIsEditorPreview() ? { preview: 'editor' } : {}),
                orderNumber: response.orderNumber,
                total: response.total,
                currency: response.currencyCode,
              }
            )
          );
        },
        error: () => {
          this.isSubmitting.set(false);
          this.toastService.error('Unable to place this order right now.');
        },
        complete: () => {
          this.isSubmitting.set(false);
        },
      });
  }

  private hydrateCheckoutPrefill(projectId: number, token: string): void {
    const cachedAccount = this.readCachedAccount(projectId);
    if (cachedAccount) {
      this.patchCheckoutFromAccount(cachedAccount);
    }

    this.publicStorefrontService.getAccount(projectId, token)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
      next: (account) => {
        if (account.sessionToken && account.sessionToken !== token) {
          this.storefrontCustomerSessionService.setSessionToken(projectId, account.sessionToken);
        }
        this.writeCachedAccount(projectId, account);
        this.patchCheckoutFromAccount(account);
      },
      error: () => {
        this.storefrontCustomerSessionService.clearSession(projectId);
        this.hydratedSessionToken.set(null);
      },
    });
  }

  private patchCheckoutFromAccount(account: PublicStorefrontCustomerAccount): void {
    this.patchControlIfUntouched('firstName', account.customer.firstName);
    this.patchControlIfUntouched('lastName', account.customer.lastName);
    this.patchControlIfUntouched('phone', account.customer.phone);
    this.patchControlIfUntouched('email', account.customer.email);
    this.patchControlIfUntouched('address', account.customer.address);
  }

  private patchControlIfUntouched(
    controlName: 'firstName' | 'lastName' | 'phone' | 'email' | 'address',
    value: string | null | undefined
  ): void {
    const control = this.checkoutForm.controls[controlName];
    const normalizedValue = value ?? '';
    const currentValue = control.value ?? '';

    if (control.dirty || currentValue.trim().length > 0) {
      return;
    }

    control.patchValue(normalizedValue, { emitEvent: false });
  }

  private readCachedAccount(projectId: number): PublicStorefrontCustomerAccount | null {
    try {
      const raw = localStorage.getItem(this.getAccountCacheKey(projectId));
      return raw ? (JSON.parse(raw) as PublicStorefrontCustomerAccount) : null;
    } catch {
      return null;
    }
  }

  private writeCachedAccount(projectId: number, account: PublicStorefrontCustomerAccount): void {
    localStorage.setItem(this.getAccountCacheKey(projectId), JSON.stringify(account));
  }

  private getAccountCacheKey(projectId: number): string {
    return `${this.accountCachePrefix}${projectId}`;
  }
}
