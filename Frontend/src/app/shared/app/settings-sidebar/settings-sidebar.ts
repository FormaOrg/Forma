import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges, inject, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { SettingsSidebarSection } from '../settings-nav.types';
import { AppIcon } from '../icons/app-icon';

@Component({
  selector: 'app-settings-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, AppIcon],
  templateUrl: './settings-sidebar.html',
  styleUrl: './settings-sidebar.css'
})
export class SettingsSidebar implements OnChanges, OnInit {
  @Input() collapsed = false;

  readonly iconSize = 20;
  isInitialized = false;

  private router = inject(Router);

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
          label: 'Back to dashboard',
          icon: 'arrow-left',
          route: '/app/home'
        }
      ]
    },
    {
      id: 'account',
      label: 'Account Settings',
      items: [
        {
          label: 'Profile',
          icon: 'user',
          route: '/app/settings/profile'
        },
        {
          label: 'Security',
          icon: 'shield',
          route: '/app/settings/security'
        },
        {
          label: 'Preferences',
          icon: 'settings',
          route: '/app/settings/preferences'
        }
      ]
    },
    {
      id: 'logs',
      label: 'Logs',
      items: [
        {
          label: 'Activity',
          icon: 'history',
          route: '/app/settings/activity'
        }
      ]
    }
  ];

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
