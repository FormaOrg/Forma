import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  HostListener,
  Input,
  OnChanges,
  SimpleChanges,
  inject
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs';
import type { SidebarChildItem, SidebarItem, SidebarSection } from '../dashboard-nav.types';
import { AppIcon } from '../icons/app-icon';
import { TranslatePipe } from '../../../features/landing-page/i18n/translate.pipe';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-side-bar',
  standalone: true,
  imports: [CommonModule, RouterModule, AppIcon, TranslatePipe],
  templateUrl: './side-bar.html',
  styleUrl: './side-bar.css'
})
export class SideBar implements OnChanges {
  @Input() collapsed = false;

  readonly iconSize = 20;

  private router = inject(Router);
  private themeService = inject(ThemeService);
  private elementRef = inject(ElementRef<HTMLElement>);

  constructor() {
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed()
      )
      .subscribe(() => this.syncDropdownsFromRoute());
    this.syncDropdownsFromRoute();
  }

  readonly sections: SidebarSection[] = [
    {
      id: 'main',
      label: 'app.sidebar.section.menu',
      items: [
        {
          label: 'app.sidebar.home',
          icon: 'home',
          route: '/app/home',
          hasDropdown: false
        },
        {
          label: 'app.sidebar.projects',
          icon: 'folder',
          route: '/app/projects',
          hasDropdown: false
        },
        {
          label: 'app.sidebar.templates',
          icon: 'layout-grid',
          hasDropdown: true,
          expanded: false,
          children: [
            { label: 'app.sidebar.templates.all', route: '/app/templates' },
            { label: 'app.sidebar.templates.mine', route: '/app/templates?tab=my' }
          ]
        }
      ]
    },
    {
      id: 'account',
      label: 'app.sidebar.section.account',
      items: [
        {
          label: 'app.sidebar.billing',
          icon: 'credit-card',
          route: '/app/billing',
          hasDropdown: false
        },
        {
          label: 'app.sidebar.settings',
          icon: 'settings',
          route: '/app/settings',
          hasDropdown: false
        }
      ]
    }
  ];

  readonly footerItems: SidebarItem[] = [
    {
      label: 'app.sidebar.help',
      icon: 'help',
      route: '/contact',
      hasDropdown: false
    }
  ];

  logoSrc(): string {
    return this.themeService.resolvedTheme() === 'dark'
      ? 'assets/Logo/FormaLogoOnly-white.svg'
      : 'assets/Logo/FormaLogoOnly.svg';
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['collapsed']?.currentValue === true) {
      this.closeAllDropdowns();
    }
  }

  trackSectionId(_: number, s: SidebarSection): string {
    return s.id;
  }

  trackItemLabel(_: number, item: SidebarItem): string {
    return item.label;
  }

  trackChildRoute(_: number, c: SidebarChildItem): string {
    return c.route;
  }

  toggleDropdown(item: SidebarItem): void {
    if (!item.hasDropdown || this.collapsed) return;

    for (const section of this.sections) {
      for (const row of section.items) {
        if (row !== item && row.hasDropdown) {
          row.expanded = false;
        }
      }
    }

    item.expanded = !item.expanded;
  }

  @HostListener('document:keydown.escape')
  handleEscapeKey(): void {
    this.closeAllDropdowns();
  }

  @HostListener('document:click', ['$event'])
  handleOutsideClick(event: MouseEvent): void {
    if (this.collapsed) {
      return;
    }

    const target = event.target as Node | null;
    if (target && !this.elementRef.nativeElement.contains(target)) {
      this.closeAllDropdowns();
    }
  }

  isChildActive(child: SidebarChildItem): boolean {
    const curUrl = this.router.url;
    const [curPath, curQuery = ''] = curUrl.split('?');
    const [childPath, childQuery = ''] = child.route.split('?');

    if (curPath !== childPath) return false;

    const curParams = new URLSearchParams(curQuery);
    const childParams = new URLSearchParams(childQuery);
    const wantTab = childParams.get('tab');
    const curTab = curParams.get('tab');

    if (wantTab === null || wantTab === '') {
      return curTab === null || curTab === '';
    }

    return curTab === wantTab;
  }

  navPath(child: SidebarChildItem): string {
    return child.route.split('?')[0];
  }

  navQuery(child: SidebarChildItem): Record<string, string> {
    const q = child.route.split('?')[1];
    if (!q) return {};
    const params = new URLSearchParams(q);
    const out: Record<string, string> = {};
    params.forEach((v, k) => {
      out[k] = v;
    });
    return out;
  }

  isParentActive(item: SidebarItem): boolean {
    if (!item.hasDropdown || !item.children?.length) return false;
    return item.children.some((c) => this.isChildActive(c));
  }

  private closeAllDropdowns(): void {
    for (const section of this.sections) {
      for (const item of section.items) {
        if (item.hasDropdown) item.expanded = false;
      }
    }
  }

  private syncDropdownsFromRoute(): void {
    if (this.collapsed) return;

    for (const section of this.sections) {
      for (const item of section.items) {
        if (item.hasDropdown && item.children?.some((c) => this.isChildActive(c))) {
          for (const s of this.sections) {
            for (const row of s.items) {
              if (row !== item && row.hasDropdown) row.expanded = false;
            }
          }
          item.expanded = true;
          return;
        }
      }
    }
  }
}
