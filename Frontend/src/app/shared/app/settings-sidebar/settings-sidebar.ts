import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges, inject, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { SettingsSidebarSection } from '../settings-nav.types';
import { AppIcon } from '../icons/app-icon';
import { TranslatePipe } from '../../../features/landing-page/i18n/translate.pipe';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-settings-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, AppIcon, TranslatePipe],
  templateUrl: './settings-sidebar.html',
  styleUrl: './settings-sidebar.css'
})
export class SettingsSidebar implements OnChanges, OnInit {
  @Input() collapsed = false;
  @Input() showBrand = true;

  readonly iconSize = 20;
  isInitialized = false;

  private router = inject(Router);
  private themeService = inject(ThemeService);

  ngOnInit() {
    // Enable transitions after initial render
    setTimeout(() => {
      this.isInitialized = true;
    }, 0);
  }

  constructor() {
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed()
      )
      .subscribe(() => {});
  }

  readonly sections: SettingsSidebarSection[] = [
    {
      id: 'navigation',
      label: '',
      items: [
        {
          label: 'settings.sidebar.back',
          icon: 'arrow-left',
          route: '/app/home'
        }
      ]
    },
    {
      id: 'account',
      label: 'settings.sidebar.account',
      items: [
        {
          label: 'settings.sidebar.profile',
          icon: 'user',
          route: '/app/settings/profile'
        },
        {
          label: 'settings.sidebar.security',
          icon: 'shield',
          route: '/app/settings/security'
        },
        {
          label: 'settings.sidebar.preferences',
          icon: 'settings',
          route: '/app/settings/preferences'
        }
      ]
    },
    {
      id: 'logs',
      label: 'settings.sidebar.logs',
      items: [
        {
          label: 'settings.sidebar.activity',
          icon: 'history',
          route: '/app/settings/activity'
        }
      ]
    }
  ];

  logoSrc(): string {
    return this.themeService.resolvedTheme() === 'dark'
      ? 'assets/Logo/FormaLogoOnly-white.svg'
      : 'assets/Logo/FormaLogoOnly.svg';
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Handle collapsed state if needed
  }

  trackSectionId(_: number, s: SettingsSidebarSection): string {
    return s.id;
  }

  trackItemLabel(_: number, item: any): string {
    return item.label;
  }

  trackItemRoute(_: number, route: string): string {
    return route;
  }

  isActive(route: string): boolean {
    return this.router.url === route;
  }
}
