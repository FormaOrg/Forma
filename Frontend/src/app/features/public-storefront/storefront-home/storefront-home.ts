import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';

import { PublicStorefrontHome, PublicStorefrontProduct } from '../../../core/models/public-storefront.model';
import { StorefrontHomepageSection } from '../../../core/models/project-storefront.model';
import { PublicStorefrontService } from '../../../core/services/public-storefront.service';
import { StoreCartService } from '../../../core/services/store-cart.service';

@Component({
  selector: 'app-storefront-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './storefront-home.html',
  styleUrl: './storefront-home.css',
})
export class StorefrontHome {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly publicStorefrontService = inject(PublicStorefrontService);
  private readonly storeCartService = inject(StoreCartService);

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
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');
  readonly sections = computed(
    () => this.storefront()?.homepage.sections.filter((section) => section.enabled) ?? []
  );
  readonly featuredProducts = computed(() => this.storefront()?.featuredProducts ?? []);
  readonly cartCount = computed(() => this.storeCartService.countFor(this.projectId()));

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

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.publicStorefrontService
      .getStorefront(projectId, { preview: this.isEditorPreview() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (storefront) => {
          this.storefront.set(storefront);
          this.isLoading.set(false);
        },
        error: () => {
          this.storefront.set(null);
          this.errorMessage.set('This storefront is not available right now.');
          this.isLoading.set(false);
        },
      });
  }

  resolveLinkHref(value: string): string {
    const href = value.trim();
    const projectId = this.projectId();

    if (!href) {
      return `/store/${projectId}/products`;
    }
    if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('#')) {
      return href;
    }
    if (href.startsWith('/store/')) {
      return href;
    }
    if (href.startsWith('/')) {
      return this.appendPreviewQuery(`/store/${projectId}${href}`);
    }

    return this.appendPreviewQuery(`/store/${projectId}/${href.replace(/^\/+/, '')}`);
  }

  productRoute(productId: number): string {
    return this.appendPreviewQuery(`/store/${this.projectId()}/products/${productId}`);
  }

  private appendPreviewQuery(url: string): string {
    if (!this.isEditorPreview()) {
      return url;
    }

    return `${url}${url.includes('?') ? '&' : '?'}preview=editor`;
  }

  readStringProp(section: StorefrontHomepageSection, key: string): string {
    const value = (section.props as Record<string, unknown>)[key];
    return typeof value === 'string' ? value : '';
  }

  trackSection = (_: number, section: StorefrontHomepageSection): string => section.id;
  trackProduct = (_: number, product: PublicStorefrontProduct): number => product.id;
}
