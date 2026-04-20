import { CommonModule, DOCUMENT, NgStyle } from '@angular/common';
import { Component, DestroyRef, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent } from 'rxjs';

import { ProjectCatalogProduct } from '../../../core/models/project-catalog.model';
import { StorefrontHomepageDocument, StorefrontHomepageSection } from '../../../core/models/project-storefront.model';
import { PublicStorefrontHome, PublicStorefrontProduct } from '../../../core/models/public-storefront.model';
import { PublicStorefrontRouteService, StorefrontRouteMode } from '../../../core/services/public-storefront-route.service';
import { StoreCartService } from '../../../core/services/store-cart.service';
import { StorefrontEditorComponentHostComponent } from '../../app/dashboard/pages/projects/project-storefront-editor/components/storefront-editor-component-host.component';
import { StorefrontEditorComponentNode } from '../../app/dashboard/pages/projects/project-storefront-editor/components/storefront-editor-component.model';
import { StorefrontPublicHeaderComponent } from './storefront-public-header.component';

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
  selector: 'app-storefront-editor-preview-page',
  standalone: true,
  imports: [CommonModule, NgStyle, StorefrontPublicHeaderComponent, StorefrontEditorComponentHostComponent],
  template: `
    @if (previewStorefront(); as previewStorefront) {
      <div class="storefront-preview">
        <div class="storefront-preview__canvas" [style.zoom]="previewScale()">
          <app-storefront-public-header
            [storefront]="previewStorefront"
            [projectId]="projectId()"
            [isEditorPreview]="true"
            [isDomainRoute]="isDomainRoute()"
          />

          @for (section of previewBodySections(); track trackSection($index, section)) {
            <div
              class="storefront-preview__section"
              [style.height.px]="readSectionHeight(section)"
              [ngStyle]="sectionSurfaceStyle(section)"
            >
              @for (component of readSectionComponents(section); track trackComponent($index, component)) {
                @let href = componentHref(component);
                @if (href) {
                  <a
                    class="storefront-preview__component"
                    [href]="href"
                    [attr.target]="componentOpenInNewTab(component) ? '_blank' : null"
                    [attr.rel]="componentOpenInNewTab(component) ? 'noreferrer noopener' : null"
                    [style.left.px]="component.frame.x"
                    [style.top.px]="component.frame.y"
                    [style.width.px]="component.frame.width"
                    [style.height.px]="component.frame.height"
                    [style.zIndex]="component.zIndex || 1"
                    [style.transform]="'rotate(' + (component.rotation || 0) + 'deg)'"
                    [style.--storefront-editor-text-align]="component.type === 'heading' || component.type === 'paragraph' || component.type === 'text' ? $any(component.props).align : null"
                    [style.--storefront-editor-image-fit]="component.type === 'image' ? $any(component.props).objectFit : null"
                    [style.--storefront-editor-container-bg]="component.type === 'container' ? $any(component.props).backgroundColor : null"
                  >
                    <div class="storefront-preview__component-content">
                      <app-storefront-editor-component-host
                        [node]="component"
                        [products]="catalogProducts()"
                        [interactiveLinks]="true"
                        [linkHrefResolver]="previewLinkResolver"
                      [cartCount]="cartCount()"
                      [storefrontProjectId]="projectId()"
                      [storefrontProductId]="selectedProductId()"
                      [storefrontIsEditorPreview]="true"
                      [storefrontIsDomainRoute]="isDomainRoute()"
                    />
                    </div>
                  </a>
                } @else {
                  <div
                    class="storefront-preview__component"
                    [style.left.px]="component.frame.x"
                    [style.top.px]="component.frame.y"
                    [style.width.px]="component.frame.width"
                    [style.height.px]="component.frame.height"
                    [style.zIndex]="component.zIndex || 1"
                    [style.transform]="'rotate(' + (component.rotation || 0) + 'deg)'"
                    [style.--storefront-editor-text-align]="component.type === 'heading' || component.type === 'paragraph' || component.type === 'text' ? $any(component.props).align : null"
                    [style.--storefront-editor-image-fit]="component.type === 'image' ? $any(component.props).objectFit : null"
                    [style.--storefront-editor-container-bg]="component.type === 'container' ? $any(component.props).backgroundColor : null"
                  >
                    <div class="storefront-preview__component-content">
                      <app-storefront-editor-component-host
                        [node]="component"
                        [products]="catalogProducts()"
                        [interactiveLinks]="true"
                        [linkHrefResolver]="previewLinkResolver"
                      [cartCount]="cartCount()"
                      [storefrontProjectId]="projectId()"
                      [storefrontProductId]="selectedProductId()"
                      [storefrontIsEditorPreview]="true"
                      [storefrontIsDomainRoute]="isDomainRoute()"
                    />
                    </div>
                  </div>
                }
              }
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    :host {
      display: block;
      background: #fff;
    }

    .storefront-preview {
      overflow-x: hidden;
      background: #fff;
    }

    .storefront-preview__canvas {
      width: 1200px;
    }

    .storefront-preview__section {
      position: relative;
      width: 100%;
      box-sizing: border-box;
      overflow: hidden;
    }

    .storefront-preview__component {
      position: absolute;
      display: block;
      box-sizing: border-box;
      text-decoration: none;
      color: inherit;
      background: transparent;
      border: 0;
      padding: 0;
      margin: 0;
      overflow: hidden;
    }

    .storefront-preview__component-content {
      width: 100%;
      height: 100%;
    }
  `],
})
export class StorefrontEditorPreviewPageComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly documentRef = inject(DOCUMENT);
  private readonly storefrontRouteService = inject(PublicStorefrontRouteService);
  private readonly storeCartService = inject(StoreCartService);

  readonly storefront = input.required<PublicStorefrontHome>();
  readonly document = input.required<StorefrontHomepageDocument>();
  readonly products = input<PublicStorefrontProduct[]>([]);
  readonly projectId = input.required<number>();
  readonly isDomainRoute = input(false);
  readonly selectedProductId = input<number | null>(null);

  readonly routeMode = computed<StorefrontRouteMode>(() => (this.isDomainRoute() ? 'domain' : 'path'));
  readonly previewQueryParams = computed(() => ({ preview: 'editor' }));
  readonly previewStorefront = computed<PublicStorefrontHome>(() => ({
    ...this.storefront(),
    homepage: this.document(),
  }));
  readonly sections = computed(() => this.document().sections.filter((section) => section.enabled));
  readonly previewBodySections = computed(() => this.sections().filter((section) => section.type !== 'header'));
  readonly catalogProducts = computed((): ProjectCatalogProduct[] =>
    this.products().map((product) => ({
      ...product,
      productType: (product.productType ?? 'PHYSICAL') as ProjectCatalogProduct['productType'],
      status: 'ACTIVE' as const,
      readyToPublish: true,
      readinessIssues: [],
    }))
  );
  readonly cartCount = computed(() => this.storeCartService.countFor(this.projectId()));
  readonly previewScale = signal(typeof window !== 'undefined' ? window.innerWidth / 1200 : 1);
  readonly previewLinkResolver = (href: string): string => this.resolveLinkHref(href);

  constructor() {
    this.ensurePreviewFontsLoaded();

    if (typeof window !== 'undefined') {
      fromEvent(window, 'resize')
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this.previewScale.set(window.innerWidth / 1200));
    }
  }

  resolveLinkHref(value: string): string {
    const href = value.trim();
    const projectId = this.projectId();

    if (!href || href === '/') {
      return this.storefrontRouteService.buildUrl(projectId, this.routeMode(), '', this.previewQueryParams());
    }
    if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('#')) {
      return href;
    }
    if (href.startsWith('/store/')) {
      return this.appendPreviewQuery(href);
    }

    return this.storefrontRouteService.buildUrl(projectId, this.routeMode(), href, this.previewQueryParams());
  }

  readSectionComponents(section: StorefrontHomepageSection): StorefrontEditorComponentNode[] {
    const value = (section.props as Record<string, unknown>)['editorComponents'];
    return Array.isArray(value)
      ? (value as StorefrontEditorComponentNode[]).filter((component) => component.isVisible !== false)
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
  trackComponent = (_: number, component: StorefrontEditorComponentNode): string => component.id;

  private appendPreviewQuery(url: string): string {
    const hashIndex = url.indexOf('#');
    if (hashIndex !== -1) {
      const base = url.slice(0, hashIndex);
      const hash = url.slice(hashIndex);
      return `${base}${base.includes('?') ? '&' : '?'}preview=editor${hash}`;
    }

    return `${url}${url.includes('?') ? '&' : '?'}preview=editor`;
  }

  private ensurePreviewFontsLoaded(): void {
    if (this.documentRef.getElementById(PREVIEW_FONTS_LINK_ID)) {
      return;
    }

    const link = this.documentRef.createElement('link');
    link.id = PREVIEW_FONTS_LINK_ID;
    link.rel = 'stylesheet';
    link.href = PREVIEW_FONTS_URL;
    this.documentRef.head.appendChild(link);
  }
}
