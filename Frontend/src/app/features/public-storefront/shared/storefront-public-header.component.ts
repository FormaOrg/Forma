import { CommonModule, NgStyle } from '@angular/common';
import { Component, HostListener, computed, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';

import { PublicStorefrontHome } from '../../../core/models/public-storefront.model';
import { StorefrontHomepageSection } from '../../../core/models/project-storefront.model';
import { StoreCartService } from '../../../core/services/store-cart.service';
import { AppIcon } from '../../../shared/app/icons/app-icon';
import {
  StorefrontEditorCartNode,
  StorefrontEditorComponentNode,
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
  private readonly storeCartService = inject(StoreCartService);

  readonly storefront = input<PublicStorefrontHome | null>(null);
  readonly projectId = input.required<number>();
  readonly isEditorPreview = input(false);

  readonly isCartDrawerOpen = signal(false);
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

  readonly cartCount = computed(() => this.storeCartService.countFor(this.projectId()));
  readonly cartItems = computed(() => this.storeCartService.itemsFor(this.projectId()));
  readonly cartSubtotal = computed(() => this.storeCartService.subtotalFor(this.projectId()));
  readonly cartOpenMode = computed(() => this.cartComponent()?.props.openMode ?? 'side');

  @HostListener('window:keydown.escape')
  handleEscape(): void {
    this.isCartDrawerOpen.set(false);
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
      void this.router.navigate(['/store', this.projectId(), 'cart'], {
        queryParams: this.isEditorPreview() ? { preview: 'editor' } : undefined,
      });
      return;
    }

    this.isCartDrawerOpen.set(true);
  }

  closeCartDrawer(): void {
    this.isCartDrawerOpen.set(false);
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
    void this.router.navigate(['/store', this.projectId(), 'cart'], {
      queryParams: this.isEditorPreview() ? { preview: 'editor' } : undefined,
    });
  }

  resolveLinkHref(value: string): string {
    const href = value.trim();
    const projectId = this.projectId();

    if (!href) {
      return `/store/${projectId}${this.isEditorPreview() ? '?preview=editor' : ''}`;
    }

    if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('#')) {
      return href;
    }

    if (href.startsWith('/store/')) {
      return this.appendPreviewQuery(href);
    }

    if (href.startsWith('/')) {
      return this.appendPreviewQuery(`/store/${projectId}${href}`);
    }

    return this.appendPreviewQuery(`/store/${projectId}/${href.replace(/^\/+/, '')}`);
  }

  private appendPreviewQuery(url: string): string {
    if (!this.isEditorPreview()) {
      return url;
    }

    return `${url}${url.includes('?') ? '&' : '?'}preview=editor`;
  }

  private readSectionComponents(section: StorefrontHomepageSection): StorefrontEditorComponentNode[] {
    const raw = (section.props as Record<string, unknown>)['editorComponents'];
    return Array.isArray(raw) ? (raw as StorefrontEditorComponentNode[]) : [];
  }
}
