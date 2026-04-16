import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import {
  PublicStorefrontCustomerAccount,
  PublicStorefrontCustomerOrder,
  PublicStorefrontHome,
} from '../../../core/models/public-storefront.model';
import { PublicStorefrontService } from '../../../core/services/public-storefront.service';
import { StorefrontCustomerSessionService } from '../../../core/services/storefront-customer-session.service';
import { ToastService } from '../../../core/services/toast.service';
import { StorefrontPublicHeaderComponent } from '../shared/storefront-public-header.component';

@Component({
  selector: 'app-storefront-account',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, StorefrontPublicHeaderComponent],
  templateUrl: './storefront-account.html',
  styleUrl: './storefront-account.css',
})
export class StorefrontAccount {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);
  private readonly publicStorefrontService = inject(PublicStorefrontService);
  private readonly storefrontSessionService = inject(StorefrontCustomerSessionService);
  private readonly toastService = inject(ToastService);

  readonly projectParamMap = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });
  readonly queryParamMap = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });
  readonly projectId = computed(() => {
    const projectId = Number(this.projectParamMap()?.get('projectId') ?? '0');
    return Number.isFinite(projectId) && projectId > 0 ? projectId : 0;
  });
  readonly isEditorPreview = computed(() => this.queryParamMap()?.get('preview') === 'editor');
  readonly previewQueryParams = computed(() => (this.isEditorPreview() ? { preview: 'editor' } : null));

  readonly storefront = signal<PublicStorefrontHome | null>(null);
  readonly account = signal<PublicStorefrontCustomerAccount | null>(null);
  readonly isLoading = signal(true);
  readonly isSubmitting = signal(false);
  readonly activeTab = signal<'login' | 'register'>('login');
  readonly errorMessage = signal('');

  readonly registerForm = this.formBuilder.nonNullable.group({
    firstName: this.formBuilder.control('', [Validators.required, Validators.maxLength(120)]),
    lastName: this.formBuilder.control('', [Validators.required, Validators.maxLength(120)]),
    email: this.formBuilder.control('', [Validators.required, Validators.email, Validators.maxLength(255)]),
    phone: this.formBuilder.control('', [Validators.maxLength(40)]),
    address: this.formBuilder.control('', [Validators.maxLength(255)]),
    password: this.formBuilder.control('', [Validators.required, Validators.minLength(8), Validators.maxLength(120)]),
  });

  readonly loginForm = this.formBuilder.nonNullable.group({
    email: this.formBuilder.control('', [Validators.required, Validators.email, Validators.maxLength(255)]),
    password: this.formBuilder.control('', [Validators.required, Validators.minLength(8), Validators.maxLength(120)]),
  });

  readonly sortedOrders = computed<PublicStorefrontCustomerOrder[]>(() => {
    return [...(this.account()?.orders ?? [])].sort((left, right) => {
      const leftTime = left.placedAt ? Date.parse(left.placedAt) : 0;
      const rightTime = right.placedAt ? Date.parse(right.placedAt) : 0;
      return rightTime - leftTime;
    });
  });

  constructor() {
    this.loadPage();
  }

  loadPage(): void {
    const projectId = this.projectId();
    if (!projectId) {
      this.errorMessage.set('Storefront not found.');
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    this.publicStorefrontService
      .getStorefront(projectId, { preview: this.isEditorPreview() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (storefront) => {
          this.storefront.set(storefront);
          this.hydrateSession(projectId);
        },
        error: () => {
          this.errorMessage.set('Unable to load this storefront right now.');
          this.isLoading.set(false);
        },
      });
  }

  setActiveTab(tab: 'login' | 'register'): void {
    this.activeTab.set(tab);
  }

  submitRegister(): void {
    if (this.registerForm.invalid || this.isSubmitting()) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const projectId = this.projectId();
    const raw = this.registerForm.getRawValue();

    this.isSubmitting.set(true);
    this.publicStorefrontService
      .registerAccount(projectId, {
        firstName: (raw.firstName ?? '').trim(),
        lastName: (raw.lastName ?? '').trim(),
        email: (raw.email ?? '').trim(),
        phone: (raw.phone ?? '').trim() || null,
        address: (raw.address ?? '').trim() || null,
        password: raw.password ?? '',
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (account) => {
          this.persistAccountSession(projectId, account);
          this.toastService.success('Account created successfully.');
        },
        error: () => {
          this.toastService.error('Unable to create account right now.');
        },
        complete: () => this.isSubmitting.set(false),
      });
  }

  submitLogin(): void {
    if (this.loginForm.invalid || this.isSubmitting()) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const projectId = this.projectId();
    const raw = this.loginForm.getRawValue();

    this.isSubmitting.set(true);
    this.publicStorefrontService
      .loginAccount(projectId, {
        email: (raw.email ?? '').trim(),
        password: raw.password ?? '',
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (account) => {
          this.persistAccountSession(projectId, account);
          this.toastService.success('Welcome back.');
        },
        error: () => {
          this.toastService.error('Unable to login with these credentials.');
        },
        complete: () => this.isSubmitting.set(false),
      });
  }

  logout(): void {
    const projectId = this.projectId();
    const token = this.storefrontSessionService.getSessionToken(projectId);

    if (!token) {
      this.storefrontSessionService.clearSession(projectId);
      this.account.set(null);
      return;
    }

    this.publicStorefrontService
      .logoutAccount(projectId, token)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.storefrontSessionService.clearSession(projectId);
          this.account.set(null);
          this.toastService.success('Signed out successfully.');
        },
        error: () => {
          this.storefrontSessionService.clearSession(projectId);
          this.account.set(null);
          this.toastService.success('Signed out locally.');
        },
      });
  }

  goToStorefront(): void {
    void this.router.navigate(['/store', this.projectId()], {
      queryParams: this.previewQueryParams(),
    });
  }

  private hydrateSession(projectId: number): void {
    const token = this.storefrontSessionService.getSessionToken(projectId);
    if (!token) {
      this.account.set(null);
      this.isLoading.set(false);
      return;
    }

    this.publicStorefrontService
      .getAccount(projectId, token)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (account) => {
          this.account.set(account);
          this.storefrontSessionService.setSessionToken(projectId, account.sessionToken);
          this.isLoading.set(false);
        },
        error: () => {
          this.storefrontSessionService.clearSession(projectId);
          this.account.set(null);
          this.isLoading.set(false);
        },
      });
  }

  private persistAccountSession(projectId: number, account: PublicStorefrontCustomerAccount): void {
    this.storefrontSessionService.setSessionToken(projectId, account.sessionToken);
    this.account.set(account);
    this.isLoading.set(false);
  }
}
