import { CommonModule, NgStyle } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';

import { PublicStorefrontHome } from '../../../core/models/public-storefront.model';
import { StorefrontHomepageSection } from '../../../core/models/project-storefront.model';
import { PublicStorefrontRouteService, StorefrontRouteMode } from '../../../core/services/public-storefront-route.service';
import { StorefrontEditorComponentHostComponent } from '../../app/dashboard/pages/projects/project-storefront-editor/components/storefront-editor-component-host.component';
import { StorefrontEditorComponentNode } from '../../app/dashboard/pages/projects/project-storefront-editor/components/storefront-editor-component.model';

@Component({
  selector: 'app-storefront-public-footer',
  standalone: true,
  imports: [CommonModule, NgStyle, StorefrontEditorComponentHostComponent],
  template: `
    @if (footerSection(); as footer) {
      <footer
        class="storefront-public-footer"
        [style.height.px]="footerHeight()"
        [ngStyle]="footerSurfaceStyle()"
      >
        @for (component of footerComponents(); track trackComponent($index, component)) {
          @let href = componentHref(component);
          @if (href) {
            <a
              class="storefront-public-footer__component"
              [href]="href"
              [attr.target]="componentOpenInNewTab(component) ? '_blank' : null"
              [attr.rel]="componentOpenInNewTab(component) ? 'noreferrer noopener' : null"
              [style.left.px]="component.frame.x"
              [style.top.px]="component.frame.y"
              [style.width.px]="component.frame.width"
              [style.height.px]="component.frame.height"
              [style.zIndex]="component.zIndex || 1"
              [style.transform]="'rotate(' + (component.rotation || 0) + 'deg)'"
            >
              <app-storefront-editor-component-host
                [node]="component"
                [interactiveLinks]="true"
                [linkHrefResolver]="resolveComponentLinkHref"
              />
            </a>
          } @else {
            <div
              class="storefront-public-footer__component"
              [style.left.px]="component.frame.x"
              [style.top.px]="component.frame.y"
              [style.width.px]="component.frame.width"
              [style.height.px]="component.frame.height"
              [style.zIndex]="component.zIndex || 1"
              [style.transform]="'rotate(' + (component.rotation || 0) + 'deg)'"
            >
              <app-storefront-editor-component-host
                [node]="component"
                [interactiveLinks]="true"
                [linkHrefResolver]="resolveComponentLinkHref"
              />
            </div>
          }
        }
      </footer>
    }
  `,
  styles: [`
    :host {
      display: block;
    }

    .storefront-public-footer {
      position: relative;
      width: 1200px;
      max-width: 100%;
      margin: 0 auto;
      overflow: hidden;
      box-sizing: border-box;
    }

    .storefront-public-footer__component {
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

    @media (max-width: 1200px) {
      .storefront-public-footer {
        display: none;
      }
    }
  `],
})
export class StorefrontPublicFooterComponent {
  private readonly storefrontRouteService = inject(PublicStorefrontRouteService);

  readonly storefront = input<PublicStorefrontHome | null>(null);
  readonly projectId = input.required<number>();
  readonly isEditorPreview = input(false);
  readonly isDomainRoute = input(false);

  readonly footerSection = computed<StorefrontHomepageSection | null>(() =>
    this.storefront()?.homepage.sections.find((section) => section.type === 'footer' && section.enabled) ?? null
  );
  readonly footerComponents = computed<StorefrontEditorComponentNode[]>(() => {
    const raw = (this.footerSection()?.props as Record<string, unknown> | undefined)?.['editorComponents'];
    return Array.isArray(raw)
      ? (JSON.parse(JSON.stringify(raw)) as StorefrontEditorComponentNode[]).filter((component) => component.isVisible !== false)
      : [];
  });
  readonly footerHeight = computed(() => {
    const value = Number((this.footerSection()?.props as Record<string, unknown> | undefined)?.['editorHeight'] ?? 0);
    return Number.isFinite(value) && value > 0 ? value : 0;
  });
  readonly routeMode = computed<StorefrontRouteMode>(() => (this.isDomainRoute() ? 'domain' : 'path'));
  readonly resolveComponentLinkHref = (value: string): string => this.resolveLinkHref(value);

  footerSurfaceStyle(): Record<string, string | null> {
    const props = (this.footerSection()?.props as Record<string, unknown> | undefined) ?? {};
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
    const href = this.componentProps(component)['href'];
    return typeof href === 'string' && href.trim() ? this.resolveLinkHref(href.trim()) : null;
  }

  componentOpenInNewTab(component: StorefrontEditorComponentNode): boolean {
    return Boolean(this.componentProps(component)['openInNewTab']);
  }

  trackComponent = (_: number, component: StorefrontEditorComponentNode): string => component.id;

  private resolveLinkHref(value: string): string {
    const href = value.trim();
    if (!href || href === '/') {
      return this.storefrontRouteService.buildUrl(
        this.projectId(),
        this.routeMode(),
        '',
        this.isEditorPreview() ? { preview: 'editor' } : undefined
      );
    }

    if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('#')) {
      return href;
    }

    if (href.startsWith('/store/')) {
      return this.isEditorPreview() ? `${href}${href.includes('?') ? '&' : '?'}preview=editor` : href;
    }

    return this.storefrontRouteService.buildUrl(
      this.projectId(),
      this.routeMode(),
      href,
      this.isEditorPreview() ? { preview: 'editor' } : undefined
    );
  }

  private componentProps(component: StorefrontEditorComponentNode): Record<string, unknown> {
    return (component.props as unknown as Record<string, unknown>) ?? {};
  }
}
