import { CommonModule } from '@angular/common';
import { Component, DestroyRef, HostListener, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
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

@Component({
  selector: 'app-project-catalog-route',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './project-catalog-route.html',
  styleUrl: './project-catalog-route.css',
})
export class ProjectCatalogRoute {
  private readonly route = inject(ActivatedRoute);
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly projectCatalogService = inject(ProjectCatalogService);
  private readonly uploadService = inject(UploadService);
  private readonly toastService = inject(ToastService);

  private searchTimeout?: number;

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
  readonly categoryDropdownOpen = signal(false);
  readonly isEditorOpen = signal(false);
  readonly editingProduct = signal<ProjectCatalogProduct | null>(null);

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
    name: ['', [Validators.required, Validators.maxLength(140)]],
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
  readonly readyProductsCount = computed(() => this.products().filter((product) => product.readyToPublish).length);
  readonly selectedCategoryLabel = computed(() =>
    this.selectedCategory() === 'ALL' ? 'All categories' : this.selectedCategory()
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
    this.closeDropdowns();
    this.loadCatalog();
  }

  updateCategory(category: string): void {
    this.selectedCategory.set(category);
    this.categoryDropdownOpen.set(false);
    this.loadCatalog();
  }

  toggleCategoryDropdown(): void {
    this.categoryDropdownOpen.update((value) => !value);
  }

  closeDropdowns(): void {
    this.categoryDropdownOpen.set(false);
  }

  openCreateEditor(): void {
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
    this.isEditorOpen.set(true);
  }

  openEditEditor(product: ProjectCatalogProduct): void {
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
    this.isEditorOpen.set(true);
  }

  closeEditor(): void {
    if (this.isSaving() || this.isUploadingImage()) {
      return;
    }

    this.isEditorOpen.set(false);
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
      this.toastService.error('Please review the product price and inventory values.');
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
        next: () => {
          this.toastService.success(existingProduct ? 'Product updated.' : 'Product created.');
          this.isEditorOpen.set(false);
          this.loadCatalog();
        },
        error: (error) => {
          this.toastService.error(this.readErrorMessage(error, 'Unable to save this product right now.'));
        },
      });
  }

  deleteProduct(product: ProjectCatalogProduct): void {
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
          if (this.editingProduct()?.id === product.id) {
            this.isEditorOpen.set(false);
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

  private buildPayload(): CreateProjectCatalogProductRequest | UpdateProjectCatalogProductRequest | null {
    const raw = this.productForm.getRawValue();
    const price = Number(raw.price);
    const compareAtPrice = raw.compareAtPrice.trim() ? Number(raw.compareAtPrice) : null;
    const inventoryQuantity = Number(raw.inventoryQuantity);

    if (!Number.isFinite(price) || price < 0 || !Number.isInteger(inventoryQuantity) || inventoryQuantity < 0) {
      return null;
    }

    if (compareAtPrice != null && (!Number.isFinite(compareAtPrice) || compareAtPrice < 0)) {
      return null;
    }

    return {
      name: raw.name.trim(),
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

  private readErrorMessage(error: unknown, fallback: string): string {
    if (typeof error === 'object' && error && 'error' in error) {
      const payload = (error as { error?: unknown }).error;
      if (typeof payload === 'object' && payload && 'message' in payload) {
        const message = (payload as { message?: unknown }).message;
        if (typeof message === 'string' && message.trim()) {
          return message;
        }
      }
    }

    return fallback;
  }
}
