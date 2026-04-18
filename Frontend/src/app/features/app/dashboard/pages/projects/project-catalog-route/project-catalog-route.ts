import { CommonModule } from '@angular/common';
import { Component, DestroyRef, HostListener, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { finalize, map } from 'rxjs';

import {
  CreateProjectCatalogProductRequest,
  ProjectCatalogPage,
  ProjectCatalogProduct,
  ProjectCatalogStatus,
  ProjectCatalogType,
  UpdateProjectCatalogProductRequest,
} from '../../../../../../core/models/project-catalog.model';
import { ProjectCatalogService } from '../../../../../../core/services/project-catalog.service';
import { ToastService } from '../../../../../../core/services/toast.service';
import { UploadService } from '../../../../../../core/services/upload.service';

type CatalogStatusFilter = 'ALL' | ProjectCatalogStatus;
type CatalogView = 'grid' | 'rows';

const trimmedRequired: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = control.value;
  return typeof value === 'string' && value.trim().length === 0
    ? { required: true }
    : null;
};

@Component({
  selector: 'app-project-catalog-route',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './project-catalog-route.html',
})
export class ProjectCatalogRoute {
  private static readonly editorTransitionMs = 220;
  private readonly deleteConfirmPreferenceKey = 'forma.catalog.skipProductDeleteConfirm';
  private readonly route = inject(ActivatedRoute);
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly projectCatalogService = inject(ProjectCatalogService);
  private readonly uploadService = inject(UploadService);
  private readonly toastService = inject(ToastService);

  private searchTimeout?: number;
  private editorCloseTimeout?: number;

  readonly projectId = toSignal(
    this.route.parent!.paramMap.pipe(map((params) => Number(params.get('projectId') ?? '0'))),
    { initialValue: Number(this.route.parent?.snapshot.paramMap.get('projectId') ?? '0') }
  );

  readonly catalogPage = signal<ProjectCatalogPage | null>(null);
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly isDeleting = signal<number | null>(null);
  readonly isUploadingImage = signal(false);
  readonly errorMessage = signal('');
  readonly searchValue = signal('');
  readonly selectedStatus = signal<CatalogStatusFilter>('ALL');
  readonly selectedCategory = signal('ALL');
  readonly activeView = signal<CatalogView>('grid');
  readonly statusDropdownOpen = signal(false);
  readonly categoryDropdownOpen = signal(false);
  readonly isEditorOpen = signal(false);
  readonly isEditorClosing = signal(false);
  readonly editingProduct = signal<ProjectCatalogProduct | null>(null);
  readonly pendingDeleteProduct = signal<ProjectCatalogProduct | null>(null);
  readonly skipDeleteConfirmThisSession = signal(
    typeof sessionStorage !== 'undefined' && sessionStorage.getItem(this.deleteConfirmPreferenceKey) === 'true'
  );
  readonly deleteConfirmOptOut = signal(false);

  readonly statusFilters: ReadonlyArray<{ label: string; value: CatalogStatusFilter }> = [
    { label: 'All', value: 'ALL' },
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Draft', value: 'DRAFT' },
    { label: 'Archived', value: 'ARCHIVED' },
  ];

  readonly productTypeOptions: ReadonlyArray<{ label: string; value: ProjectCatalogType }> = [
    { label: 'Physical', value: 'PHYSICAL' },
    { label: 'Digital', value: 'DIGITAL' },
    { label: 'Service', value: 'SERVICE' },
  ];

  readonly productStatusOptions: ReadonlyArray<{ label: string; value: ProjectCatalogStatus }> = [
    { label: 'Draft', value: 'DRAFT' },
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Archived', value: 'ARCHIVED' },
  ];

  readonly productForm = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, trimmedRequired, Validators.maxLength(140)]],
    description: ['', [Validators.maxLength(2000)]],
    sku: ['', [Validators.maxLength(80)]],
    category: ['', [Validators.maxLength(120)]],
    productType: ['PHYSICAL' as ProjectCatalogType, [Validators.required]],
    status: ['DRAFT' as ProjectCatalogStatus, [Validators.required]],
    price: ['0.00', [Validators.required]],
    compareAtPrice: [''],
    inventoryQuantity: ['0', [Validators.required]],
    imageUrl: ['', [Validators.maxLength(1024)]],
    tags: [''],
  });

  readonly summary = computed(() => this.catalogPage()?.summary ?? null);
  readonly products = computed(() => this.catalogPage()?.products ?? []);
  readonly categories = computed(() => this.catalogPage()?.categories ?? []);
  readonly hasCatalogProducts = computed(() => (this.summary()?.totalProducts ?? 0) > 0);
  readonly readyProductsCount = computed(() => this.products().filter((product) => product.readyToPublish).length);
  readonly selectedCategoryLabel = computed(() =>
    this.selectedCategory() === 'ALL' ? 'All categories' : this.selectedCategory()
  );
  readonly selectedStatusLabel = computed(() =>
    this.statusFilters.find((filter) => filter.value === this.selectedStatus())?.label ?? 'All'
  );
  readonly editorTitle = computed(() => {
    const product = this.editingProduct();
    return product ? `Edit ${product.name}` : 'Add product';
  });

  constructor() {
    this.loadCatalog();
  }

  loadCatalog(): void {
    const projectId = this.projectId();
    if (!projectId) {
      this.errorMessage.set('Project not found.');
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.projectCatalogService
      .getCatalogPage(projectId, {
        search: this.searchValue(),
        status: this.selectedStatus(),
        category: this.selectedCategory() === 'ALL' ? undefined : this.selectedCategory(),
      })
      .pipe(finalize(() => this.isLoading.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (page) => this.catalogPage.set(page),
        error: (error) => {
          this.catalogPage.set(null);
          this.errorMessage.set(this.readErrorMessage(error, 'Unable to load the catalog right now.'));
        },
      });
  }

  updateSearch(value: string): void {
    this.searchValue.set(value);
    window.clearTimeout(this.searchTimeout);
    this.searchTimeout = window.setTimeout(() => this.loadCatalog(), 250);
  }

  updateStatus(status: CatalogStatusFilter): void {
    this.selectedStatus.set(status);
    this.statusDropdownOpen.set(false);
    this.loadCatalog();
  }

  updateCategory(category: string): void {
    this.selectedCategory.set(category);
    this.categoryDropdownOpen.set(false);
    this.loadCatalog();
  }

  updateView(view: CatalogView): void {
    this.activeView.set(view);
  }

  toggleCategoryDropdown(): void {
    this.statusDropdownOpen.set(false);
    this.categoryDropdownOpen.update((value) => !value);
  }

  toggleStatusDropdown(): void {
    this.categoryDropdownOpen.set(false);
    this.statusDropdownOpen.update((value) => !value);
  }

  closeDropdowns(): void {
    this.statusDropdownOpen.set(false);
    this.categoryDropdownOpen.set(false);
  }

  openCreateEditor(): void {
    this.reopenEditorIfClosing();
    this.editingProduct.set(null);
    this.productForm.reset({
      name: '',
      description: '',
      sku: '',
      category: '',
      productType: 'PHYSICAL',
      status: 'DRAFT',
      price: '0.00',
      compareAtPrice: '',
      inventoryQuantity: '0',
      imageUrl: '',
      tags: '',
    });
    this.isEditorClosing.set(false);
    this.isEditorOpen.set(true);
  }

  openEditEditor(product: ProjectCatalogProduct): void {
    this.reopenEditorIfClosing();
    this.editingProduct.set(product);
    this.productForm.reset({
      name: product.name,
      description: product.description ?? '',
      sku: product.sku ?? '',
      category: product.category ?? '',
      productType: product.productType,
      status: product.status,
      price: this.toDecimalString(product.price),
      compareAtPrice: product.compareAtPrice != null ? this.toDecimalString(product.compareAtPrice) : '',
      inventoryQuantity: String(product.inventoryQuantity),
      imageUrl: product.imageUrl ?? '',
      tags: product.tags.join(', '),
    });
    this.isEditorClosing.set(false);
    this.isEditorOpen.set(true);
  }

  closeEditor(): void {
    if (this.isSaving() || this.isUploadingImage() || !this.isEditorOpen() || this.isEditorClosing()) {
      return;
    }

    this.isEditorClosing.set(true);
    window.clearTimeout(this.editorCloseTimeout);
    this.editorCloseTimeout = window.setTimeout(() => {
      this.isEditorOpen.set(false);
      this.isEditorClosing.set(false);
    }, ProjectCatalogRoute.editorTransitionMs);
  }

  saveProduct(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    const projectId = this.projectId();
    if (!projectId) {
      return;
    }

    const payload = this.buildPayload();
    if (!payload) {
      this.toastService.error('Please review the product name, price, and inventory values.');
      return;
    }

    this.isSaving.set(true);

    const existingProduct = this.editingProduct();
    const request$ = existingProduct
      ? this.projectCatalogService.updateProduct(
          projectId,
          existingProduct.id,
          payload as UpdateProjectCatalogProductRequest
        )
      : this.projectCatalogService.createProduct(
          projectId,
          payload as CreateProjectCatalogProductRequest
        );

    request$
      .pipe(finalize(() => this.isSaving.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (savedProduct) => {
          if (existingProduct) {
            this.toastService.success('Product updated.');
          } else if (!this.matchesCurrentFilters(savedProduct)) {
            this.searchValue.set('');
            this.selectedStatus.set('ALL');
            this.selectedCategory.set('ALL');
            this.closeDropdowns();
            this.toastService.success('Product created. Filters were cleared so the new product is visible.');
          } else {
            this.toastService.success('Product created.');
          }
          window.clearTimeout(this.editorCloseTimeout);
          this.isEditorOpen.set(false);
          this.isEditorClosing.set(false);
          this.loadCatalog();
        },
        error: (error) => {
          this.toastService.error(this.readErrorMessage(error, 'Unable to save this product right now.'));
        },
      });
  }

  deleteProduct(product: ProjectCatalogProduct): void {
    if (!this.skipDeleteConfirmThisSession()) {
      this.pendingDeleteProduct.set(product);
      this.deleteConfirmOptOut.set(false);
      return;
    }

    this.performDeleteProduct(product);
  }

  closeDeleteConfirm(): void {
    if (this.isDeleting()) {
      return;
    }

    this.pendingDeleteProduct.set(null);
    this.deleteConfirmOptOut.set(false);
  }

  setDeleteConfirmOptOut(value: boolean): void {
    this.deleteConfirmOptOut.set(value);
  }

  confirmDeleteProduct(): void {
    const product = this.pendingDeleteProduct();
    if (!product) {
      return;
    }

    if (this.deleteConfirmOptOut()) {
      this.skipDeleteConfirmThisSession.set(true);
      sessionStorage.setItem(this.deleteConfirmPreferenceKey, 'true');
    }

    this.performDeleteProduct(product);
  }

  private performDeleteProduct(product: ProjectCatalogProduct): void {
    const projectId = this.projectId();
    if (!projectId || this.isDeleting() === product.id) {
      return;
    }

    this.isDeleting.set(product.id);
    this.projectCatalogService
      .deleteProduct(projectId, product.id)
      .pipe(finalize(() => this.isDeleting.set(null)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastService.success(`Deleted ${product.name}.`);
          this.pendingDeleteProduct.set(null);
          this.deleteConfirmOptOut.set(false);
          if (this.editingProduct()?.id === product.id) {
            window.clearTimeout(this.editorCloseTimeout);
            this.isEditorOpen.set(false);
            this.isEditorClosing.set(false);
          }
          this.loadCatalog();
        },
        error: (error) => {
          this.toastService.error(this.readErrorMessage(error, 'Unable to delete this product right now.'));
        },
      });
  }

  uploadCoverImage(event: Event): void {
    const projectId = this.projectId();
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0];
    const previousImageUrl = this.productForm.controls.imageUrl.value.trim();

    if (!projectId || !file) {
      return;
    }

    const validation = this.uploadService.validateMedia(file);
    if (!validation.valid) {
      this.toastService.error(validation.error ?? 'This file cannot be uploaded.');
      input.value = '';
      return;
    }

    this.isUploadingImage.set(true);
    this.uploadService
      .uploadProjectMedia(file, projectId)
      .pipe(
        finalize(() => {
          this.isUploadingImage.set(false);
          input.value = '';
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (response) => {
          if (previousImageUrl && previousImageUrl !== response.url) {
            this.uploadService
              .deleteFile(previousImageUrl)
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe({
                error: () => {
                  // Best-effort cleanup only. We still keep the new uploaded cover.
                },
              });
          }

          this.productForm.controls.imageUrl.setValue(response.url);
          this.toastService.success('Cover image uploaded.');
        },
        error: (error) => {
          this.toastService.error(this.readErrorMessage(error, 'Unable to upload the image right now.'));
        },
      });
  }

  trackByProduct = (_: number, product: ProjectCatalogProduct): number => product.id;

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;

    if (!target?.closest('.catalog-toolbar__dropdown')) {
      this.closeDropdowns();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.pendingDeleteProduct()) {
      this.closeDeleteConfirm();
      return;
    }

    if (this.isEditorOpen()) {
      this.closeEditor();
    }
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    }).format(value);
  }

  formatDate(value: string | null): string {
    if (!value) {
      return 'Just now';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  lowStockLabel(product: ProjectCatalogProduct): string {
    if (product.inventoryQuantity <= 0) {
      return 'Out of stock';
    }
    if (product.inventoryQuantity <= 5) {
      return 'Low stock';
    }
    return 'In stock';
  }

  private matchesCurrentFilters(product: ProjectCatalogProduct): boolean {
    const selectedStatus = this.selectedStatus();
    const selectedCategory = this.selectedCategory();
    const normalizedSearch = this.normalizeSearchableValue(this.searchValue());

    const matchesStatus = selectedStatus === 'ALL' || product.status === selectedStatus;
    const matchesCategory =
      selectedCategory === 'ALL'
      || this.normalizeSearchableValue(product.category) === this.normalizeSearchableValue(selectedCategory);

    if (!normalizedSearch) {
      return matchesStatus && matchesCategory;
    }

    const searchableValues = [
      product.name,
      product.sku,
      product.category,
      product.description,
      ...product.tags,
    ];

    const matchesSearch = searchableValues.some((value) =>
      this.normalizeSearchableValue(value).includes(normalizedSearch)
    );

    return matchesStatus && matchesCategory && matchesSearch;
  }

  private buildPayload(): CreateProjectCatalogProductRequest | UpdateProjectCatalogProductRequest | null {
    const raw = this.productForm.getRawValue();
    const name = raw.name.trim();
    const price = Number(raw.price);
    const compareAtPrice = raw.compareAtPrice.trim() ? Number(raw.compareAtPrice) : null;
    const inventoryQuantity = Number(raw.inventoryQuantity);

    if (!name) {
      return null;
    }

    if (!Number.isFinite(price) || price < 0 || !Number.isInteger(inventoryQuantity) || inventoryQuantity < 0) {
      return null;
    }

    if (compareAtPrice != null && (!Number.isFinite(compareAtPrice) || compareAtPrice < 0)) {
      return null;
    }

    return {
      name,
      description: this.blankToNull(raw.description),
      sku: this.blankToNull(raw.sku),
      category: this.blankToNull(raw.category),
      productType: raw.productType,
      status: raw.status,
      price,
      compareAtPrice,
      inventoryQuantity,
      imageUrl: this.blankToNull(raw.imageUrl),
      tags: raw.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0),
    };
  }

  private blankToNull(value: string): string | null {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private toDecimalString(value: number): string {
    return Number.isInteger(value) ? `${value}.00` : String(value);
  }

  private normalizeSearchableValue(value: string | null | undefined): string {
    return value?.trim().toLowerCase() ?? '';
  }

  private readErrorMessage(error: unknown, fallback: string): string {
    if (typeof error === 'object' && error && 'error' in error) {
      const payload = (error as { error?: unknown }).error;
      if (typeof payload === 'string' && payload.trim()) {
        return payload;
      }
      if (typeof payload === 'object' && payload && 'message' in payload) {
        const message = (payload as { message?: unknown }).message;
        if (typeof message === 'string' && message.trim()) {
          return message;
        }
      }
      if (typeof payload === 'object' && payload) {
        const fieldMessages = Object.values(payload)
          .filter((value): value is string => typeof value === 'string' && value.trim().length > 0);
        if (fieldMessages.length > 0) {
          return fieldMessages.join(' ');
        }
      }
    }

    if (typeof error === 'object' && error && 'message' in error) {
      const message = (error as { message?: unknown }).message;
      if (typeof message === 'string' && message.trim()) {
        return message;
      }
    }

    return fallback;
  }

  private reopenEditorIfClosing(): void {
    if (!this.isEditorClosing()) {
      return;
    }

    window.clearTimeout(this.editorCloseTimeout);
    this.isEditorClosing.set(false);
  }
}
