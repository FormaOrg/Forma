import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, effect, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import {
  PublicStorefrontCustomerAccount,
  PublicStorefrontCustomerOrder,
} from '../../../core/models/public-storefront.model';
import { PublicStorefrontService } from '../../../core/services/public-storefront.service';
import { PublicStorefrontRouteService, StorefrontRouteMode } from '../../../core/services/public-storefront-route.service';
import { StorefrontCustomerSessionService } from '../../../core/services/storefront-customer-session.service';
import { ToastService } from '../../../core/services/toast.service';
import { StorefrontEditorAccountFormNode } from '../../app/dashboard/pages/projects/project-storefront-editor/components/storefront-editor-component.model';

@Component({
  selector: 'app-storefront-public-account-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section
      class="storefront-public-account-form"
      [style.--storefront-account-accent]="node().props.accentColor"
      [style.--storefront-account-background]="node().props.backgroundColor"
      [style.--storefront-account-panel]="node().props.panelColor"
      [style.--storefront-account-text]="node().props.textColor"
    >
      <div class="storefront-public-account-form__panel">
        @if (isHydrating()) {
          <div class="storefront-public-account-form__panel-head">
            <div>
              <span>{{ node().props.eyebrow }}</span>
              <h1>{{ node().props.title }}</h1>
              <p>{{ node().props.description }}</p>
            </div>
          </div>

          <div class="storefront-public-account-form__loading">
            <div class="storefront-public-account-form__loading-line storefront-public-account-form__loading-line--wide"></div>
            <div class="storefront-public-account-form__loading-line"></div>
            <div class="storefront-public-account-form__loading-line"></div>
          </div>
        } @else if (account(); as userAccount) {
          <div class="storefront-public-account-form__panel-head">
            <div>
              <span>{{ node().props.eyebrow }}</span>
              <h1>{{ userAccount.customer.fullName }}</h1>
              <p>{{ node().props.ordersTitle }}</p>
            </div>
            <button type="button" (click)="logout()">{{ node().props.signOutLabel }}</button>
          </div>

          <div class="storefront-public-account-form__details">
            <article>
              <span>Email</span>
              <strong>{{ userAccount.customer.email }}</strong>
            </article>
            <article>
              <span>Phone</span>
              <strong>{{ userAccount.customer.phone || 'Not provided' }}</strong>
            </article>
            <article>
              <span>Address</span>
              <strong>{{ userAccount.customer.address || 'Not provided' }}</strong>
            </article>
          </div>

          <div class="storefront-public-account-form__orders">
            <div class="storefront-public-account-form__orders-head">
              <h2>{{ node().props.ordersTitle }}</h2>
              <button type="button" class="storefront-public-account-form__link-button" (click)="goToProducts()">
                {{ node().props.continueShoppingLabel }}
              </button>
            </div>

            @if (sortedOrders().length) {
              <div class="storefront-public-account-form__order-list">
                @for (order of sortedOrders(); track order.orderId) {
                  <article class="storefront-public-account-form__order-card">
                    <div>
                      <span>{{ order.orderNumber }}</span>
                      <strong>{{ order.total | currency:'TND':'symbol':'1.0-2' }}</strong>
                    </div>
                    <p>
                      {{ order.placedAt ? (order.placedAt | date:'medium') : 'Unknown date' }}
                      · {{ order.paymentStatus || 'UNKNOWN' }}
                      · {{ order.fulfillmentStatus || 'UNKNOWN' }}
                    </p>
                  </article>
                }
              </div>
            } @else {
              <p class="storefront-public-account-form__empty">{{ node().props.emptyOrdersLabel }}</p>
            }
          </div>
        } @else {
          <div class="storefront-public-account-form__panel-head">
            <div>
              <span>{{ node().props.eyebrow }}</span>
              <h1>{{ node().props.title }}</h1>
              <p>{{ node().props.description }}</p>
            </div>
            <button type="button" (click)="goBack()">{{ node().props.backButtonLabel }}</button>
          </div>

          <div class="storefront-public-account-form__tabs">
            <button
              type="button"
              [class.storefront-public-account-form__tab--active]="activeTab() === 'login'"
              (click)="setActiveTab('login')"
            >
              {{ node().props.loginTabLabel }}
            </button>
            @if (node().props.showRegisterTab) {
              <button
                type="button"
                [class.storefront-public-account-form__tab--active]="activeTab() === 'register'"
                (click)="setActiveTab('register')"
              >
                {{ node().props.registerTabLabel }}
              </button>
            }
          </div>

          @if (activeTab() === 'login') {
            <form [formGroup]="loginForm" (ngSubmit)="submitLogin()" class="storefront-public-account-form__form">
              <label>
                <span>{{ node().props.emailLabel }}</span>
                <input type="email" formControlName="email" [placeholder]="node().props.loginEmailPlaceholder" />
              </label>
              <label>
                <span>{{ node().props.passwordLabel }}</span>
                <input type="password" formControlName="password" [placeholder]="node().props.loginPasswordPlaceholder" />
              </label>
              <button type="submit" [disabled]="isSubmitting()">
                {{ isSubmitting() ? node().props.submitLoginPendingLabel : node().props.submitLoginLabel }}
              </button>
            </form>
          } @else {
            <form [formGroup]="registerForm" (ngSubmit)="submitRegister()" class="storefront-public-account-form__form">
              <label>
                <span>{{ node().props.emailLabel }}</span>
                <input type="email" formControlName="email" [placeholder]="node().props.registerEmailPlaceholder" />
              </label>
              <label>
                <span>{{ node().props.passwordLabel }}</span>
                <input type="password" formControlName="password" [placeholder]="node().props.registerPasswordPlaceholder" />
              </label>
              <button type="submit" [disabled]="isSubmitting()">
                {{ isSubmitting() ? node().props.submitRegisterPendingLabel : node().props.submitRegisterLabel }}
              </button>
            </form>
          }
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

    .storefront-public-account-form {
      min-height: 100%;
      background: var(--storefront-account-background, #ffffff);
      color: var(--storefront-account-text, #0f172a);
      box-sizing: border-box;
      padding: 24px;
    }

    .storefront-public-account-form__panel {
      max-width: 720px;
      margin: 0 auto;
      background: var(--storefront-account-panel, #f8fafc);
      border: 1px solid rgba(15, 23, 42, 0.1);
      border-radius: 22px;
      box-shadow: 0 18px 36px rgba(15, 23, 42, 0.08);
      padding: 24px;
    }

    .storefront-public-account-form__panel-head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 22px;
    }

    .storefront-public-account-form__panel-head span {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: #64748b;
    }

    .storefront-public-account-form__panel-head h1 {
      margin: 6px 0 0;
      font-size: 1.45rem;
      line-height: 1.2;
      color: var(--storefront-account-text, #0f172a);
    }

    .storefront-public-account-form__panel-head p {
      margin: 10px 0 0;
      color: #64748b;
      font-size: 0.95rem;
      line-height: 1.6;
    }

    .storefront-public-account-form__panel-head button {
      border: 1px solid color-mix(in srgb, var(--storefront-account-accent, #0f172a) 15%, white);
      background: color-mix(in srgb, var(--storefront-account-accent, #0f172a) 8%, white);
      color: var(--storefront-account-accent, #0f172a);
      padding: 8px 12px;
      border-radius: 10px;
      cursor: pointer;
      font: inherit;
    }

    .storefront-public-account-form__tabs {
      display: inline-flex;
      border: 1px solid rgba(148, 163, 184, 0.4);
      border-radius: 11px;
      margin-bottom: 16px;
      overflow: hidden;
    }

    .storefront-public-account-form__tabs button {
      border: 0;
      background: #ffffff;
      color: #334155;
      min-width: 126px;
      padding: 10px 14px;
      cursor: pointer;
      font: inherit;
    }

    .storefront-public-account-form__tab--active {
      background: var(--storefront-account-accent, #0f172a) !important;
      color: #ffffff !important;
    }

    .storefront-public-account-form__form {
      display: grid;
      gap: 12px;
    }

    .storefront-public-account-form__form label {
      display: grid;
      gap: 6px;
    }

    .storefront-public-account-form__form label span {
      font-size: 0.82rem;
      color: #475569;
    }

    .storefront-public-account-form__form input {
      border: 1px solid rgba(148, 163, 184, 0.55);
      border-radius: 10px;
      padding: 10px 12px;
      font: inherit;
      background: #ffffff;
    }

    .storefront-public-account-form__form button[type='submit'] {
      border: 0;
      border-radius: 12px;
      background: var(--storefront-account-accent, #0f172a);
      color: #ffffff;
      padding: 10px 14px;
      font: inherit;
      cursor: pointer;
    }

    .storefront-public-account-form__form button[type='submit']:disabled {
      opacity: 0.72;
      cursor: default;
    }

    .storefront-public-account-form__details {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
      margin-bottom: 20px;
    }

    .storefront-public-account-form__details article {
      border: 1px solid rgba(148, 163, 184, 0.35);
      border-radius: 14px;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      background: #ffffff;
    }

    .storefront-public-account-form__details article span {
      font-size: 0.78rem;
      color: #64748b;
    }

    .storefront-public-account-form__details article strong {
      display: block;
      min-width: 0;
      font-size: 0.95rem;
      color: var(--storefront-account-text, #0f172a);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .storefront-public-account-form__orders-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 10px;
    }

    .storefront-public-account-form__orders-head h2 {
      margin: 0;
      font-size: 1.1rem;
      color: var(--storefront-account-text, #0f172a);
    }

    .storefront-public-account-form__link-button {
      border: 0;
      background: transparent;
      color: var(--storefront-account-accent, #0f172a);
      cursor: pointer;
      padding: 0;
      font: inherit;
    }

    .storefront-public-account-form__order-list {
      display: grid;
      gap: 10px;
    }

    .storefront-public-account-form__order-card {
      border: 1px solid rgba(148, 163, 184, 0.35);
      border-radius: 12px;
      padding: 12px;
      background: #ffffff;
    }

    .storefront-public-account-form__order-card > div {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .storefront-public-account-form__order-card p {
      margin: 8px 0 0;
      color: #64748b;
      font-size: 0.9rem;
    }

    .storefront-public-account-form__empty {
      color: #64748b;
      margin: 0;
    }

    .storefront-public-account-form__loading {
      display: grid;
      gap: 12px;
    }

    .storefront-public-account-form__loading-line {
      height: 48px;
      border-radius: 12px;
      background:
        linear-gradient(90deg, rgba(226, 232, 240, 0.9) 25%, rgba(241, 245, 249, 1) 50%, rgba(226, 232, 240, 0.9) 75%);
      background-size: 200% 100%;
      animation: storefront-public-account-form-loading 1.2s ease-in-out infinite;
    }

    .storefront-public-account-form__loading-line--wide {
      height: 88px;
    }

    @keyframes storefront-public-account-form-loading {
      0% {
        background-position: 200% 0;
      }
      100% {
        background-position: -200% 0;
      }
    }

    @media (max-width: 720px) {
      .storefront-public-account-form {
        padding: 12px;
      }

      .storefront-public-account-form__panel {
        padding: 18px;
      }

      .storefront-public-account-form__panel-head,
      .storefront-public-account-form__orders-head {
        flex-direction: column;
        align-items: flex-start;
      }

      .storefront-public-account-form__details {
        grid-template-columns: 1fr;
      }
    }
  `],
})
export class StorefrontPublicAccountFormComponent {
  private readonly accountCachePrefix = 'forma_storefront_customer_account_';
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly publicStorefrontService = inject(PublicStorefrontService);
  private readonly storefrontRouteService = inject(PublicStorefrontRouteService);
  private readonly storefrontSessionService = inject(StorefrontCustomerSessionService);
  private readonly toastService = inject(ToastService);

  readonly node = input.required<StorefrontEditorAccountFormNode>();
  readonly projectId = input<number | null>(null);
  readonly isEditorPreview = input(false);
  readonly isDomainRoute = input(false);
  readonly activeTab = signal<'login' | 'register'>('login');
  readonly account = signal<PublicStorefrontCustomerAccount | null>(null);
  readonly isSubmitting = signal(false);
  readonly isHydrating = signal(false);
  readonly routeMode = computed<StorefrontRouteMode>(() => (this.isDomainRoute() ? 'domain' : 'path'));
  readonly sortedOrders = computed<PublicStorefrontCustomerOrder[]>(() =>
    [...(this.account()?.orders ?? [])].sort((left, right) => {
      const leftTime = left.placedAt ? Date.parse(left.placedAt) : 0;
      const rightTime = right.placedAt ? Date.parse(right.placedAt) : 0;
      return rightTime - leftTime;
    })
  );

  readonly loginForm = this.formBuilder.nonNullable.group({
    email: this.formBuilder.control('', [Validators.required, Validators.email, Validators.maxLength(255)]),
    password: this.formBuilder.control('', [Validators.required, Validators.minLength(8), Validators.maxLength(120)]),
  });

  readonly registerForm = this.formBuilder.nonNullable.group({
    email: this.formBuilder.control('', [Validators.required, Validators.email, Validators.maxLength(255)]),
    password: this.formBuilder.control('', [Validators.required, Validators.minLength(8), Validators.maxLength(120)]),
  });

  constructor() {
    effect(() => {
      const projectId = this.projectId();
      if (!projectId) {
        this.account.set(null);
        this.isHydrating.set(false);
        return;
      }

      this.hydrateSession(projectId);
    });
  }

  setActiveTab(tab: 'login' | 'register'): void {
    this.activeTab.set(tab);
  }

  submitLogin(): void {
    if (this.loginForm.invalid || this.isSubmitting()) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const projectId = this.projectId();
    if (!projectId) {
      return;
    }

    const raw = this.loginForm.getRawValue();
    const email = (raw.email ?? '').trim();
    const password = raw.password ?? '';
    this.isSubmitting.set(true);

    this.publicStorefrontService
      .loginAccount(projectId, { email, password })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (account) => {
          this.storefrontSessionService.setSessionToken(projectId, account.sessionToken);
          this.writeCachedAccount(projectId, account);
          this.account.set(account);
          this.toastService.success('Welcome back.');
        },
        error: () => {
          this.toastService.error('Unable to login with these credentials.');
          this.isSubmitting.set(false);
        },
        complete: () => this.isSubmitting.set(false),
      });
  }

  submitRegister(): void {
    if (this.registerForm.invalid || this.isSubmitting()) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const projectId = this.projectId();
    if (!projectId) {
      return;
    }

    const raw = this.registerForm.getRawValue();
    const email = (raw.email ?? '').trim();
    const password = raw.password ?? '';
    const derivedFirstName = this.deriveFirstName(email);
    this.isSubmitting.set(true);

    this.publicStorefrontService
      .registerAccount(projectId, {
        firstName: derivedFirstName,
        lastName: 'Customer',
        email,
        phone: null,
        address: null,
        password,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (account) => {
          this.storefrontSessionService.setSessionToken(projectId, account.sessionToken);
          this.writeCachedAccount(projectId, account);
          this.account.set(account);
          this.toastService.success('Account created successfully.');
        },
        error: () => {
          this.toastService.error('Unable to create account right now.');
          this.isSubmitting.set(false);
        },
        complete: () => this.isSubmitting.set(false),
      });
  }

  logout(): void {
    const projectId = this.projectId();
    if (!projectId) {
      return;
    }

    const token = this.storefrontSessionService.getSessionToken(projectId);
    if (!token) {
      this.clearCachedAccount(projectId);
      this.account.set(null);
      this.isHydrating.set(false);
      return;
    }

    this.publicStorefrontService
      .logoutAccount(projectId, token)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.storefrontSessionService.clearSession(projectId);
          this.clearCachedAccount(projectId);
          this.account.set(null);
          this.toastService.success('Signed out successfully.');
        },
        error: () => {
          this.storefrontSessionService.clearSession(projectId);
          this.clearCachedAccount(projectId);
          this.account.set(null);
          this.toastService.success('Signed out locally.');
        },
      });
  }

  goBack(): void {
    const projectId = this.projectId();
    if (!projectId) {
      return;
    }

    void this.router.navigateByUrl(
      this.storefrontRouteService.buildUrl(
        projectId,
        this.routeMode(),
        '',
        this.isEditorPreview() ? { preview: 'editor' } : undefined
      )
    );
  }

  goToProducts(): void {
    const projectId = this.projectId();
    if (!projectId) {
      return;
    }

    void this.router.navigateByUrl(
      this.storefrontRouteService.buildUrl(
        projectId,
        this.routeMode(),
        'products',
        this.isEditorPreview() ? { preview: 'editor' } : undefined
      )
    );
  }

  private deriveFirstName(email: string): string {
    const localPart = email.trim().split('@')[0] ?? '';
    const normalized = localPart
      .replace(/[^a-zA-Z0-9]+/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean)[0];

    if (!normalized) {
      return 'New';
    }

    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }

  private hydrateSession(projectId: number): void {
    const token = this.storefrontSessionService.getSessionToken(projectId);
    if (!token) {
      this.clearCachedAccount(projectId);
      this.account.set(null);
      this.isHydrating.set(false);
      return;
    }

    const cachedAccount = this.readCachedAccount(projectId);
    if (cachedAccount) {
      this.account.set(cachedAccount);
      this.isHydrating.set(false);
    } else {
      this.isHydrating.set(true);
    }

    this.publicStorefrontService
      .getAccount(projectId, token)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (account) => {
          this.writeCachedAccount(projectId, account);
          this.account.set(account);
          this.storefrontSessionService.setSessionToken(projectId, account.sessionToken);
          this.isHydrating.set(false);
        },
        error: () => {
          this.storefrontSessionService.clearSession(projectId);
          this.clearCachedAccount(projectId);
          this.account.set(null);
          this.isHydrating.set(false);
        },
      });
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

  private clearCachedAccount(projectId: number): void {
    localStorage.removeItem(this.getAccountCacheKey(projectId));
  }

  private getAccountCacheKey(projectId: number): string {
    return `${this.accountCachePrefix}${projectId}`;
  }
}
