import { CommonModule, DOCUMENT } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { fromEvent } from 'rxjs';

import { PublicStorefrontHome, PublicStorefrontProduct } from '../../../core/models/public-storefront.model';
import { StorefrontHomepageSection } from '../../../core/models/project-storefront.model';
import { ProjectCatalogProduct } from '../../../core/models/project-catalog.model';
import { PublicStorefrontService } from '../../../core/services/public-storefront.service';
import { PublicStorefrontRouteService, StorefrontRouteMode } from '../../../core/services/public-storefront-route.service';
import { StorefrontAnalyticsService } from '../../../core/services/storefront-analytics.service';
import { StoreCartService } from '../../../core/services/store-cart.service';
import { StorefrontPublicHeaderComponent } from '../shared/storefront-public-header.component';
import { StorefrontEditorComponentHostComponent } from '../../app/dashboard/pages/projects/project-storefront-editor/components/storefront-editor-component-host.component';
import { StorefrontEditorComponentNode } from '../../app/dashboard/pages/projects/project-storefront-editor/components/storefront-editor-component.model';

const PREVIEW_FONTS_LINK_ID = 'forma-preview-google-fonts';
const PREVIEW_FONTS_URL =
  'https://fonts.googleapis.com/css2?display=swap' +
  '&family=Inter:wght@400;500;600;700' +
  '&family=Poppins:wght@400;500;600;700' +
  '&family=Manrope:wght@400;500;600;700' +
  '&family=DM+Sans:wght@400;500;600;700' +
  '&family=Plus+Jakarta+Sans:wght@400;500;600;700' +
  '&family=Space+Grotesk:wght@400;500;600;700' +
  '&family=Sora:wght@400;500;600;700' +
  '&family=Outfit:wght@400;500;600;700' +
  '&family=Urbanist:wght@400;500;600;700' +
  '&family=Work+Sans:wght@400;500;600;700' +
  '&family=Libre+Franklin:wght@400;500;600;700' +
  '&family=IBM+Plex+Sans:wght@400;500;600;700' +
  '&family=Figtree:wght@400;500;600;700' +
  '&family=Nunito+Sans:wght@400;500;600;700' +
  '&family=Mulish:wght@400;500;600;700' +
  '&family=Archivo:wght@400;500;600;700' +
  '&family=Montserrat:wght@400;500;600;700' +
  '&family=Raleway:wght@400;500;600;700' +
  '&family=Karla:wght@400;500;600;700' +
  '&family=Rubik:wght@400;500;600;700' +
  '&family=Hedvig+Letters+Serif:wght@400;500;600;700' +
  '&family=Merriweather:wght@400;500;600;700' +
  '&family=Lora:wght@400;500;600;700' +
  '&family=Cormorant+Garamond:wght@400;500;600;700' +
  '&family=Playfair+Display:wght@400;500;600;700' +
  '&family=DM+Serif+Display:wght@400;500;600;700' +
  '&family=Libre+Baskerville:wght@400;500;600;700' +
  '&family=Crimson+Text:wght@400;500;600;700' +
  '&family=Cormorant+Infant:wght@400;500;600;700' +
  '&family=Bitter:wght@400;500;600;700' +
  '&family=Spectral:wght@400;500;600;700' +
  '&family=Bricolage+Grotesque:wght@400;500;600;700' +
  '&family=Syne:wght@400;500;600;700' +
  '&family=Fraunces:wght@400;500;600;700' +
  '&family=Archivo+Black:wght@400;500;600;700' +
  '&family=Bebas+Neue:wght@400;500;600;700' +
  '&family=Oswald:wght@400;500;600;700' +
  '&family=Abril+Fatface:wght@400;500;600;700' +
  '&family=Anton:wght@400;500;600;700' +
  '&family=League+Spartan:wght@400;500;600;700' +
  '&family=Alfa+Slab+One:wght@400;500;600;700' +
  '&family=Righteous:wght@400;500;600;700' +
  '&family=Unbounded:wght@400;500;600;700' +
  '&family=Fira+Mono:wght@400;500;600;700' +
  '&family=IBM+Plex+Mono:wght@400;500;600;700' +
  '&family=JetBrains+Mono:wght@400;500;600;700' +
  '&family=Space+Mono:wght@400;500;600;700' +
  '&family=Source+Code+Pro:wght@400;500;600;700' +
  '&family=Inconsolata:wght@400;500;600;700' +
  '&family=Caveat:wght@400;500;600;700' +
  '&family=Patrick+Hand:wght@400;500;600;700' +
  '&family=Shadows+Into+Light:wght@400;500;600;700' +
  '&family=Permanent+Marker:wght@400;500;600;700';

@Component({
  selector: 'app-storefront-home',
  standalone: true,
  imports: [CommonModule, RouterLink, StorefrontPublicHeaderComponent, StorefrontEditorComponentHostComponent],
  templateUrl: './storefront-home.html',
  styleUrl: './storefront-home.css',
})
export class StorefrontHome {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);
  private readonly publicStorefrontService = inject(PublicStorefrontService);
  private readonly storefrontRouteService = inject(PublicStorefrontRouteService);
  private readonly analyticsService = inject(StorefrontAnalyticsService);
  private readonly storeCartService = inject(StoreCartService);

  readonly projectParamMap = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });
  readonly queryParamMap = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });
  readonly projectIdParam = computed(() => this.projectParamMap()?.get('projectId'));
  readonly routeMode = computed<StorefrontRouteMode>(() =>
    this.storefrontRouteService.resolveRouteMode(this.projectIdParam())
  );
  readonly isDomainRoute = computed(() => this.routeMode() === 'domain');
  readonly projectId = computed(() => this.storefrontRouteService.resolveProjectId(this.projectIdParam()));
  readonly isEditorPreview = computed(() => this.queryParamMap()?.get('preview') === 'editor');
  readonly previewQueryParams = computed(() => (this.isEditorPreview() ? { preview: 'editor' } : null));
  readonly productsPath = computed(() =>
    this.storefrontRouteService.buildPath(this.projectId(), this.routeMode(), 'products')
  );

  readonly storefront = signal<PublicStorefrontHome | null>(null);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');
  readonly sections = computed(
    () => this.storefront()?.homepage.sections.filter((section) => section.enabled) ?? []
  );
  readonly previewBodySections = computed(
    () => this.sections().filter((section) => section.type !== 'header')
  );
  readonly featuredProducts = computed(() => this.storefront()?.featuredProducts ?? []);
  readonly featuredProductsAsCatalog = computed((): ProjectCatalogProduct[] =>
    this.featuredProducts().map((p) => ({
      ...p,
      productType: (p.productType ?? 'PHYSICAL') as ProjectCatalogProduct['productType'],
      status: 'ACTIVE' as const,
      readyToPublish: true,
      readinessIssues: [],
    }))
  );

  readonly catalogProducts = signal<ProjectCatalogProduct[]>([]);

  readonly cartCount = computed(() => this.storeCartService.countFor(this.projectId()));

  readonly previewScale = signal(typeof window !== 'undefined' ? window.innerWidth / 1200 : 1);

  readonly previewLinkResolver = (href: string): string => this.resolveLinkHref(href);

  constructor() {
    this.loadStorefront();
    if (typeof window !== 'undefined') {
      fromEvent(window, 'resize')
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this.previewScale.set(window.innerWidth / 1200));
    }
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
          if (this.isEditorPreview()) {
            this.loadPreviewExtras(projectId);
          } else {
            this.analyticsService.trackPageView(projectId, window.location.pathname, storefront.storeName);
          }
        },
        error: () => {
          this.storefront.set(null);
          this.errorMessage.set('This storefront is not available right now.');
          this.isLoading.set(false);
        },
      });
  }

  private loadPreviewExtras(projectId: number): void {
    this.ensurePreviewFontsLoaded();

    this.publicStorefrontService
      .getProducts(projectId, { preview: true })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (products) => {
          this.catalogProducts.set(
            products.map((p) => ({
              ...p,
              productType: (p.productType ?? 'PHYSICAL') as ProjectCatalogProduct['productType'],
              status: 'ACTIVE' as const,
              readyToPublish: true,
              readinessIssues: [],
            }))
          );
        },
        error: () => {},
      });
  }

  private ensurePreviewFontsLoaded(): void {
    if (this.document.getElementById(PREVIEW_FONTS_LINK_ID)) {
      return;
    }

    const link = this.document.createElement('link');
    link.id = PREVIEW_FONTS_LINK_ID;
    link.rel = 'stylesheet';
    link.href = PREVIEW_FONTS_URL;
    this.document.head.appendChild(link);
  }

  resolveLinkHref(value: string): string {
    const href = value.trim();
    const projectId = this.projectId();

    if (!href) {
      return this.storefrontRouteService.buildUrl(
        projectId,
        this.routeMode(),
        'products',
        this.previewQueryParams() ?? undefined
      );
    }
    if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('#')) {
      return href;
    }
    if (href.startsWith('/store/')) {
      return this.appendPreviewQuery(href);
    }
    return this.storefrontRouteService.buildUrl(
      projectId,
      this.routeMode(),
      href,
      this.previewQueryParams() ?? undefined
    );
  }

  productRoute(productId: number): string {
    return this.storefrontRouteService.buildUrl(
      this.projectId(),
      this.routeMode(),
      `products/${productId}`,
      this.previewQueryParams() ?? undefined
    );
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

  readSectionComponents(section: StorefrontHomepageSection): StorefrontEditorComponentNode[] {
    const value = (section.props as Record<string, unknown>)['editorComponents'];
    return Array.isArray(value)
      ? (value as StorefrontEditorComponentNode[]).filter((c) => c.isVisible !== false)
      : [];
  }

  readSectionHeight(section: StorefrontHomepageSection): number {
    return Number((section.props as Record<string, unknown>)['editorHeight'] ?? 0) || 0;
  }

  sectionSurfaceStyle(section: StorefrontHomepageSection): Record<string, string | null> {
    const props = section.props as Record<string, unknown>;
    const bg = String(props['editorBackgroundColor'] ?? '');
    const borderWidth = Number(props['editorBorderWidth'] ?? 0);
    const borderStyle = String(props['editorBorderStyle'] ?? 'solid');
    const borderColor = String(props['editorBorderColor'] ?? '#111827');
    const radius = Number(props['editorRadius'] ?? 0);
    const opacity = Number(props['editorOpacity'] ?? 100);

    return {
      background: bg || null,
      borderWidth: `${borderWidth}px`,
      borderStyle,
      borderColor: borderWidth > 0 ? borderColor : 'transparent',
      borderRadius: `${radius}px`,
      opacity: String(opacity / 100),
    };
  }

  componentHref(component: StorefrontEditorComponentNode): string | null {
    const href = (component.props as unknown as Record<string, unknown>)['href'];
    if (typeof href === 'string' && href.trim()) {
      return this.resolveLinkHref(href.trim());
    }
    return null;
  }

  componentOpenInNewTab(component: StorefrontEditorComponentNode): boolean {
    return Boolean((component.props as unknown as Record<string, unknown>)['openInNewTab']);
  }

  trackSection = (_: number, section: StorefrontHomepageSection): string => section.id;
  trackProduct = (_: number, product: PublicStorefrontProduct): number => product.id;
  trackComponent = (_: number, component: StorefrontEditorComponentNode): string => component.id;
}
