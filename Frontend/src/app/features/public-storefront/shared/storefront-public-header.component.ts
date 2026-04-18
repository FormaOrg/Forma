import { CommonModule, NgStyle } from '@angular/common';
import { Component, DestroyRef, HostListener, computed, effect, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';

import { PublicStorefrontHome, PublicStorefrontProduct } from '../../../core/models/public-storefront.model';
import { StorefrontHomepageSection } from '../../../core/models/project-storefront.model';
import { PublicStorefrontRouteService, StorefrontRouteMode } from '../../../core/services/public-storefront-route.service';
import { PublicStorefrontService } from '../../../core/services/public-storefront.service';
import { StoreCartService } from '../../../core/services/store-cart.service';
import { StorefrontCustomerSessionService } from '../../../core/services/storefront-customer-session.service';
import { AppIcon } from '../../../shared/app/icons/app-icon';
import {
  createStorefrontEditorComponentNode,
  StorefrontEditorAccountNode,
  StorefrontEditorButtonNode,
  StorefrontEditorCartNode,
  StorefrontEditorComponentNode,
  StorefrontEditorSearchNode,
} from '../../app/dashboard/pages/projects/project-storefront-editor/components/storefront-editor-component.model';
import { StorefrontEditorComponentHostComponent } from '../../app/dashboard/pages/projects/project-storefront-editor/components/storefront-editor-component-host.component';

@Component({
  selector: 'app-storefront-public-header',
  standalone: true,
  imports: [CommonModule, NgStyle, AppIcon, StorefrontEditorComponentHostComponent],
  templateUrl: './storefront-public-header.component.html',
  styleUrl: './storefront-public-header.component.css',
})
export class StorefrontPublicHeaderComponent {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly publicStorefrontService = inject(PublicStorefrontService);
  private readonly storefrontRouteService = inject(PublicStorefrontRouteService);
  private readonly storeCartService = inject(StoreCartService);
  private readonly storefrontCustomerSessionService = inject(StorefrontCustomerSessionService);

  readonly storefront = input<PublicStorefrontHome | null>(null);
  readonly projectId = input.required<number>();
  readonly isEditorPreview = input(false);
  readonly isDomainRoute = input(false);

  readonly isCartDrawerOpen = signal(false);
  readonly isSearchOpen = signal(false);
  readonly searchQuery = signal('');
  readonly searchableProducts = signal<PublicStorefrontProduct[]>([]);
  readonly resolveComponentLinkHref = (value: string): string => this.resolveLinkHref(value);

  readonly headerSection = computed<StorefrontHomepageSection | null>(() => {
    return this.storefront()?.homepage.sections.find((section) => section.type === 'header' && section.enabled) ?? null;
  });

  readonly headerComponents = computed<StorefrontEditorComponentNode[]>(() => {
    const section = this.headerSection();
    if (!section) {
      return [];
    }

    return this.readSectionComponents(section)
      .filter((component) => component.isVisible)
      .sort((left, right) => (left.zIndex || 0) - (right.zIndex || 0));
  });

  readonly headerHeight = computed(() => {
    const value = Number((this.headerSection()?.props as Record<string, unknown> | undefined)?.['editorHeight'] ?? 96);
    return Number.isFinite(value) && value > 0 ? value : 96;
  });

  readonly cartComponent = computed<StorefrontEditorCartNode | null>(() => {
    const component = this.headerComponents().find((entry) => entry.type === 'cart');
    return component?.type === 'cart' ? component : null;
  });
  readonly searchComponent = computed<StorefrontEditorSearchNode | null>(() => {
    const component = this.headerComponents().find((entry) => entry.type === 'search');
    return component?.type === 'search' ? component : null;
  });
  readonly accountComponent = computed<StorefrontEditorAccountNode | null>(() => {
    const component = this.headerComponents().find((entry) => entry.type === 'account');
    return component?.type === 'account' ? component : null;
  });
  readonly searchOverlayLabel = computed(() => this.searchComponent()?.props.label || 'Search');
  readonly searchOverlayPlaceholder = computed(() => this.searchComponent()?.props.placeholder || 'Search products');
  readonly hasCustomerSession = computed(() => !!this.storefrontCustomerSessionService.getSessionToken(this.projectId()));
  readonly hasEditorAccountComponent = computed(() => !!this.accountComponent());

  readonly cartCount = computed(() => this.storeCartService.countFor(this.projectId()));
  readonly cartItems = computed(() => this.storeCartService.itemsFor(this.projectId()));
  readonly cartSubtotal = computed(() => this.storeCartService.subtotalFor(this.projectId()));
  readonly cartOpenMode = computed(() => this.cartComponent()?.props.openMode ?? 'side');
  readonly normalizedSearchQuery = computed(() => this.searchQuery().trim().toLowerCase());
  readonly matchedProducts = computed(() => {
    const query = this.normalizedSearchQuery();
    if (!query) {
      return [] as PublicStorefrontProduct[];
    }

    return this.searchableProducts()
      .filter((product) => this.productMatchesQuery(product, query))
      .slice(0, 6);
  });
  readonly searchSuggestions = computed(() => {
    const query = this.normalizedSearchQuery();
    if (!query) {
      return [] as string[];
    }

    const seen = new Set<string>();
    const suggestions: string[] = [];
    for (const product of this.searchableProducts()) {
      const tokens = [
        ...product.name.split(/[^a-zA-Z0-9]+/),
        ...(product.category ? product.category.split(/[^a-zA-Z0-9]+/) : []),
        ...product.tags.flatMap((tag) => tag.split(/[^a-zA-Z0-9]+/)),
      ];

      for (const token of tokens) {
        const normalized = token.trim().toLowerCase();
        if (!normalized || normalized.length < 2 || !normalized.includes(query) || seen.has(normalized)) {
          continue;
        }

        seen.add(normalized);
        suggestions.push(token.trim());
        if (suggestions.length >= 5) {
          return suggestions;
        }
      }
    }

    return suggestions;
  });
  readonly routeMode = computed<StorefrontRouteMode>(() => (this.isDomainRoute() ? 'domain' : 'path'));

  constructor() {
    effect(() => {
      const projectId = this.projectId();
      if (!projectId) {
        this.searchableProducts.set([]);
        return;
      }

      this.publicStorefrontService
        .getProducts(projectId, { preview: this.isEditorPreview() })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (products) => this.searchableProducts.set(products),
          error: () => this.searchableProducts.set([]),
        });
    });
  }

  @HostListener('window:keydown.escape')
  handleEscape(): void {
    this.isCartDrawerOpen.set(false);
    this.isSearchOpen.set(false);
  }

  componentStyle(component: StorefrontEditorComponentNode): Record<string, string> {
    return {
      left: `${component.frame.x}px`,
      top: `${component.frame.y}px`,
      width: `${component.frame.width}px`,
      height: `${component.frame.height}px`,
      zIndex: String(component.zIndex || 1),
      transform: `rotate(${component.rotation || 0}deg)`,
    };
  }

  trackComponent = (_: number, component: StorefrontEditorComponentNode): string => component.id;

  openCartFromIcon(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    if (this.cartOpenMode() === 'page') {
      void this.router.navigateByUrl(this.buildStorefrontUrl('cart'));
      return;
    }

    this.isCartDrawerOpen.set(true);
  }

  openSearchOverlay(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isSearchOpen.set(true);
  }

  closeSearchOverlay(): void {
    this.isSearchOpen.set(false);
    this.searchQuery.set('');
  }

  updateSearchQuery(value: string): void {
    this.searchQuery.set(value);
  }

  applySuggestion(value: string): void {
    this.searchQuery.set(value);
  }

  openProductFromSearch(productId: number): void {
    this.closeSearchOverlay();
    void this.router.navigateByUrl(this.buildStorefrontUrl(`products/${productId}`));
  }

  closeCartDrawer(): void {
    this.isCartDrawerOpen.set(false);
  }

  goToAccount(event?: MouseEvent): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    void this.router.navigateByUrl(this.buildStorefrontUrl('account'));
  }

  increaseQuantity(productId: number, quantity: number): void {
    this.storeCartService.updateQuantity(this.projectId(), productId, quantity + 1);
  }

  decreaseQuantity(productId: number, quantity: number): void {
    this.storeCartService.updateQuantity(this.projectId(), productId, quantity - 1);
  }

  removeItem(productId: number): void {
    this.storeCartService.removeItem(this.projectId(), productId);
  }

  goToFullCart(): void {
    this.isCartDrawerOpen.set(false);
    void this.router.navigateByUrl(this.buildStorefrontUrl('cart'));
  }

  resolveLinkHref(value: string): string {
    const href = value.trim();
    const projectId = this.projectId();

    if (!href) {
      return this.buildStorefrontUrl();
    }

    if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('#')) {
      return href;
    }

    if (href.startsWith('/store/')) {
      return this.isEditorPreview() ? this.appendPreviewQuery(href) : href;
    }

    return this.storefrontRouteService.buildUrl(
      projectId,
      this.routeMode(),
      href,
      this.isEditorPreview() ? { preview: 'editor' } : undefined
    );
  }

  private appendPreviewQuery(url: string): string {
    if (!this.isEditorPreview()) {
      return url;
    }

    return `${url}${url.includes('?') ? '&' : '?'}preview=editor`;
  }

  private productMatchesQuery(product: PublicStorefrontProduct, query: string): boolean {
    const haystacks = [
      product.name,
      product.description ?? '',
      product.category ?? '',
      product.sku ?? '',
      ...product.tags,
    ];

    return haystacks.some((value) => value.toLowerCase().includes(query));
  }

  private readSectionComponents(section: StorefrontHomepageSection): StorefrontEditorComponentNode[] {
    const raw = (section.props as Record<string, unknown>)['editorComponents'];
    if (!Array.isArray(raw)) {
      return [];
    }

    return (JSON.parse(JSON.stringify(raw)) as StorefrontEditorComponentNode[]).map((component) =>
      this.normalizePreviewComponent(component)
    );
  }

  private normalizePreviewComponent(component: StorefrontEditorComponentNode): StorefrontEditorComponentNode {
    if (component.type === 'button' && component.props.href === '/account') {
      const account = createStorefrontEditorComponentNode('account') as StorefrontEditorAccountNode;
      const button = component as StorefrontEditorButtonNode;

      return {
        ...account,
        id: component.id,
        name: component.name || 'Account',
        isLocked: component.isLocked,
        isVisible: component.isVisible,
        zIndex: component.zIndex,
        parentContainerId: component.parentContainerId,
        groupId: component.groupId,
        rotation: component.rotation,
        frame: {
          ...component.frame,
          width: 40,
          height: 40,
        },
        responsiveFrames: component.responsiveFrames,
        props: {
          ...account.props,
          iconColor: button.props.textColor || '#111827',
        },
        children: [],
      };
    }

    return component;
  }

  private buildStorefrontUrl(path = ''): string {
    return this.storefrontRouteService.buildUrl(
      this.projectId(),
      this.routeMode(),
      path,
      this.isEditorPreview() ? { preview: 'editor' } : undefined
    );
  }
}
