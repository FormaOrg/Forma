import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { PublicStorefrontHome } from '../../../core/models/public-storefront.model';
import { PublicStorefrontService } from '../../../core/services/public-storefront.service';
import { StoreCartService } from '../../../core/services/store-cart.service';
import { StorefrontCustomerSessionService } from '../../../core/services/storefront-customer-session.service';
import { ToastService } from '../../../core/services/toast.service';
import { StorefrontPublicHeaderComponent } from '../shared/storefront-public-header.component';

@Component({
  selector: 'app-storefront-checkout',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, StorefrontPublicHeaderComponent],
  templateUrl: './storefront-checkout.html',
  styleUrl: './storefront-checkout.css',
})
export class StorefrontCheckout {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);
  private readonly publicStorefrontService = inject(PublicStorefrontService);
  private readonly storeCartService = inject(StoreCartService);
  private readonly storefrontCustomerSessionService = inject(StorefrontCustomerSessionService);
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

  readonly storefront = signal<PublicStorefrontHome | null>(null);
  readonly isLoading = signal(true);
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal('');
  readonly items = computed(() => this.storeCartService.itemsFor(this.projectId()));
  readonly subtotal = computed(() => this.storeCartService.subtotalFor(this.projectId()));

  readonly checkoutForm = this.formBuilder.nonNullable.group({
    firstName: this.formBuilder.control('', [Validators.required, Validators.maxLength(120)]),
    lastName: this.formBuilder.control('', [Validators.required, Validators.maxLength(120)]),
    phone: this.formBuilder.control('', [Validators.required, Validators.maxLength(40)]),
    email: this.formBuilder.control('', [Validators.email, Validators.maxLength(255)]),
    address: this.formBuilder.control('', [Validators.required, Validators.maxLength(255)]),
    notes: this.formBuilder.control('', [Validators.maxLength(1000)]),
  });

  constructor() {
    this.loadStorefront();
  }

  loadStorefront(): void {
    const projectId = this.projectId();
    if (!projectId) {
      this.errorMessage.set('Storefront not found.');
      this.isLoading.set(false);
      return;
    }

    this.publicStorefrontService
      .getStorefront(projectId, { preview: this.isEditorPreview() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (storefront) => {
          this.storefront.set(storefront);
          this.isLoading.set(false);
          this.prefillFromAccountSession();
        },
        error: () => {
          this.storefront.set(null);
          this.errorMessage.set('Unable to load checkout right now.');
          this.isLoading.set(false);
        },
      });
  }

  submitCheckout(): void {
    if (this.checkoutForm.invalid || !this.items().length || this.isSubmitting()) {
      this.checkoutForm.markAllAsTouched();
      return;
    }

    if (this.isEditorPreview()) {
      const previewTotal = this.subtotal();
      this.storeCartService.clear(this.projectId());
      void this.router.navigate(['/store', this.projectId(), 'checkout', 'success'], {
        queryParams: {
          preview: 'editor',
          orderNumber: `PREVIEW-${Date.now().toString().slice(-6)}`,
          total: previewTotal,
          currency: 'TND',
        },
      });
      return;
    }

    const raw = this.checkoutForm.getRawValue();
    const customerSessionToken = this.storefrontCustomerSessionService.getSessionToken(this.projectId());

    this.isSubmitting.set(true);
    this.publicStorefrontService
      .checkout(this.projectId(), {
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
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.storeCartService.clear(this.projectId());
          void this.router.navigate(['/store', this.projectId(), 'checkout', 'success'], {
            queryParams: {
              ...(this.isEditorPreview() ? { preview: 'editor' } : {}),
              orderNumber: response.orderNumber,
              total: response.total,
              currency: response.currencyCode,
            },
          });
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

  private prefillFromAccountSession(): void {
    const projectId = this.projectId();
    const token = this.storefrontCustomerSessionService.getSessionToken(projectId);
    if (!token) {
      return;
    }

    this.publicStorefrontService
      .getAccount(projectId, token)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (account) => {
          this.storefrontCustomerSessionService.setSessionToken(projectId, account.sessionToken);
          this.checkoutForm.patchValue({
            firstName: account.customer.firstName ?? '',
            lastName: account.customer.lastName ?? '',
            phone: account.customer.phone ?? '',
            email: account.customer.email ?? '',
            address: account.customer.address ?? '',
          });
        },
        error: () => {
          this.storefrontCustomerSessionService.clearSession(projectId);
        },
      });
  }
}
