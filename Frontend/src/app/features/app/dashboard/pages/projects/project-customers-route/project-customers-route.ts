import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { finalize, map } from 'rxjs';
import {
  CreateProjectCustomerRequest,
  ProjectCustomer,
  ProjectCustomersPage,
  UpdateProjectCustomerRequest,
} from '../../../../../../core/models/project-customers.model';
import { ProjectCustomersService } from '../../../../../../core/services/project-customers.service';
import { ToastService } from '../../../../../../core/services/toast.service';
import { I18nService } from '../../../../../landing-page/i18n/i18n.service';
import { TranslatePipe } from '../../../../../landing-page/i18n/translate.pipe';

@Component({
  selector: 'app-project-customers-route',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './project-customers-route.html',
  styleUrl: './project-customers-route.css',
})
export class ProjectCustomersRoute {
  private static readonly editorTransitionMs = 220;
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);
  private readonly projectCustomersService = inject(ProjectCustomersService);
  private readonly toastService = inject(ToastService);
  private readonly i18n = inject(I18nService);

  private searchTimeout?: number;
  private editorCloseTimeout?: number;

  readonly projectId = toSignal(
    this.route.parent!.paramMap.pipe(map((params) => Number(params.get('projectId') ?? '0'))),
    { initialValue: Number(this.route.parent?.snapshot.paramMap.get('projectId') ?? '0') }
  );

  readonly page = signal<ProjectCustomersPage | null>(null);
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly isDeleting = signal<number | null>(null);
  readonly errorMessage = signal('');
  readonly searchValue = signal('');
  readonly selectedZone = signal('ALL');
  readonly editingCustomer = signal<ProjectCustomer | null>(null);
  readonly isEditorOpen = signal(false);
  readonly isEditorClosing = signal(false);

  readonly customerForm = this.formBuilder.nonNullable.group({
    firstName: ['', [Validators.required, Validators.maxLength(120)]],
    lastName: ['', [Validators.required, Validators.maxLength(120)]],
    email: ['', [Validators.email, Validators.maxLength(255)]],
    phone: ['', [Validators.maxLength(40)]],
    address: ['', [Validators.maxLength(255)]],
    zoneLabel: ['', [Validators.maxLength(120)]],
  });

  readonly summary = computed(() => this.page()?.summary ?? null);
  readonly customers = computed(() => this.page()?.customers ?? []);
  readonly zones = computed(() => this.page()?.zones ?? []);
  readonly editorTitle = computed(() =>
    this.editingCustomer()
      ? this.i18n.t('project.customers.editor.editTitle')
      : this.i18n.t('project.customers.editor.addTitle')
  );
  readonly visibleCustomersLabel = computed(() => {
    const count = this.customers().length;
    return count === 1
      ? `${count} ${this.i18n.t('project.customers.common.customer')}`
      : `${count} ${this.i18n.t('project.customers.common.customers')}`;
  });
  readonly hasFilters = computed(() => this.searchValue().trim().length > 0 || this.selectedZone() !== 'ALL');
  readonly totalRevenue = computed(() =>
    this.customers().reduce((sum, customer) => sum + customer.totalSpent, 0)
  );
  readonly averageCustomerValue = computed(() => {
    const customers = this.customers();
    if (!customers.length) {
      return 0;
    }

    return this.totalRevenue() / customers.length;
  });
  readonly returnRate = computed(() => {
    const summary = this.summary();
    if (!summary?.totalCustomers) {
      return 0;
    }

    return (summary.repeatCustomers / summary.totalCustomers) * 100;
  });
  readonly topZone = computed(() => {
    const counts = new Map<string, number>();

    for (const customer of this.customers()) {
      const zone = customer.zoneLabel?.trim();
      if (!zone) {
        continue;
      }

      counts.set(zone, (counts.get(zone) ?? 0) + 1);
    }

    let topZone = this.i18n.t('project.customers.common.noZonesYet');
    let topCount = 0;
    for (const [zone, count] of counts.entries()) {
      if (count > topCount) {
        topZone = zone;
        topCount = count;
      }
    }

    return topZone;
  });

  constructor() {
    this.loadCustomers();
  }

  loadCustomers(): void {
    const projectId = this.projectId();
    if (!projectId) {
      this.errorMessage.set(this.i18n.t('project.customers.errors.notFound'));
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.projectCustomersService.getCustomersPage(projectId, {
      search: this.searchValue(),
      zone: this.selectedZone(),
    })
      .pipe(finalize(() => this.isLoading.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (page) => this.page.set(page),
        error: () => {
          this.page.set(null);
          this.errorMessage.set(this.i18n.t('project.customers.errors.load'));
        },
      });
  }

  updateSearch(value: string): void {
    this.searchValue.set(value);
    window.clearTimeout(this.searchTimeout);
    this.searchTimeout = window.setTimeout(() => this.loadCustomers(), 250);
  }

  updateZone(zone: string): void {
    this.selectedZone.set(zone);
    this.loadCustomers();
  }

  openCreateEditor(): void {
    this.reopenEditorIfClosing();
    this.editingCustomer.set(null);
    this.customerForm.reset({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      zoneLabel: '',
    });
    this.isEditorClosing.set(false);
    this.isEditorOpen.set(true);
  }

  openEditEditor(customer: ProjectCustomer): void {
    this.reopenEditorIfClosing();
    this.editingCustomer.set(customer);
    this.customerForm.reset({
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email ?? '',
      phone: customer.phone ?? '',
      address: customer.address ?? '',
      zoneLabel: customer.zoneLabel ?? '',
    });
    this.isEditorClosing.set(false);
    this.isEditorOpen.set(true);
  }

  closeEditor(): void {
    if (this.isSaving() || !this.isEditorOpen() || this.isEditorClosing()) {
      return;
    }

    this.isEditorClosing.set(true);
    window.clearTimeout(this.editorCloseTimeout);
    this.editorCloseTimeout = window.setTimeout(() => {
      this.isEditorOpen.set(false);
      this.isEditorClosing.set(false);
    }, ProjectCustomersRoute.editorTransitionMs);
  }

  saveCustomer(): void {
    if (this.customerForm.invalid) {
      this.customerForm.markAllAsTouched();
      return;
    }

    const projectId = this.projectId();
    if (!projectId) {
      return;
    }

    this.isSaving.set(true);
    const payload = this.buildPayload();
    const editingCustomer = this.editingCustomer();
    const request$ = editingCustomer
      ? this.projectCustomersService.updateCustomer(projectId, editingCustomer.id, payload as UpdateProjectCustomerRequest)
      : this.projectCustomersService.createCustomer(projectId, payload as CreateProjectCustomerRequest);

    request$
      .pipe(finalize(() => this.isSaving.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastService.success(
            editingCustomer
              ? this.i18n.t('project.customers.success.updated')
              : this.i18n.t('project.customers.success.created')
          );
          window.clearTimeout(this.editorCloseTimeout);
          this.isEditorOpen.set(false);
          this.isEditorClosing.set(false);
          this.loadCustomers();
        },
        error: () => this.toastService.error(this.i18n.t('project.customers.errors.save')),
      });
  }

  deleteCustomer(customer: ProjectCustomer): void {
    const projectId = this.projectId();
    if (!projectId || this.isDeleting() === customer.id) {
      return;
    }

    this.isDeleting.set(customer.id);
    this.projectCustomersService.deleteCustomer(projectId, customer.id)
      .pipe(finalize(() => this.isDeleting.set(null)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastService.success(this.i18n.t('project.customers.success.deleted'));
          this.loadCustomers();
        },
        error: () => this.toastService.error(this.i18n.t('project.customers.errors.delete')),
      });
  }

  formatMoney(value: number): string {
    return new Intl.NumberFormat(this.i18n.lang() === 'fr' ? 'fr-FR' : 'en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  formatDate(value: string | null): string {
    if (!value) {
      return this.i18n.t('project.customers.common.noOrdersYet');
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString(this.i18n.lang() === 'fr' ? 'fr-FR' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  formatCompactMoney(value: number): string {
    return new Intl.NumberFormat(this.i18n.lang() === 'fr' ? 'fr-FR' : 'en-US', {
      notation: 'compact',
      maximumFractionDigits: value >= 1000 ? 1 : 0,
    }).format(value);
  }

  formatPercent(value: number): string {
    return `${Math.round(value)}%`;
  }

  getCustomerInitials(customer: ProjectCustomer): string {
    const initials = `${customer.firstName.charAt(0)}${customer.lastName.charAt(0)}`.trim();
    return initials.toUpperCase() || 'CU';
  }

  trackByCustomer = (_: number, customer: ProjectCustomer): number => customer.id;

  private buildPayload(): CreateProjectCustomerRequest | UpdateProjectCustomerRequest {
    const raw = this.customerForm.getRawValue();
    return {
      firstName: raw.firstName.trim(),
      lastName: raw.lastName.trim(),
      email: this.blankToNull(raw.email),
      phone: this.blankToNull(raw.phone),
      address: this.blankToNull(raw.address),
      zoneLabel: this.blankToNull(raw.zoneLabel),
    };
  }

  private blankToNull(value: string): string | null {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  }

  private reopenEditorIfClosing(): void {
    if (!this.isEditorClosing()) {
      return;
    }

    window.clearTimeout(this.editorCloseTimeout);
    this.isEditorClosing.set(false);
  }
}
