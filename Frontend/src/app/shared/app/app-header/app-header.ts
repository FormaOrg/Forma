import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  HostListener,
  inject,
  Input,
  Output,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs';
import type { HeaderActionButton, ProfileMenuItem } from '../dashboard-nav.types';
import { AppIcon } from '../icons/app-icon';

@Component({
  selector: 'app-app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, AppIcon],
  templateUrl: './app-header.html',
  styleUrl: './app-header.css'
})
export class AppHeader {
  @Input() sidebarCollapsed = false;
  @Output() toggleSidebar = new EventEmitter<void>();

  private router = inject(Router);

  readonly pageTitle = signal(this.readPageTitle());

  isProfileMenuOpen = false;

  search = {
    placeholder: 'Search…',
    shortcut: 'Ctrl K'
  };

  actionButtons: HeaderActionButton[] = [
    { label: 'Upgrade plan', variant: 'secondary', route: '/pricing' },
    { label: 'Hire a professional', variant: 'primary', route: '/contact' }
  ];

  profile = {
    name: 'John Doe',
    role: 'Admin',
    avatar: 'https://i.pravatar.cc/100?img=12'
  };

  profileMenuItems: ProfileMenuItem[] = [
    { label: 'Profile', icon: 'user', action: 'profile', route: '/app/profile' },
    { label: 'Billing', icon: 'credit-card', action: 'billing', route: '/app/billing' },
    { label: 'Settings', icon: 'settings', action: 'settings', route: '/app/settings' },
    { label: 'Help & Support', icon: 'help', action: 'help', route: '/contact' },
    { label: 'Log out', icon: 'log-out', action: 'logout', danger: true }
  ];

  readonly iconSize = 20;

  constructor() {
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed()
      )
      .subscribe(() => this.pageTitle.set(this.readPageTitle()));
  }

  onToggleSidebar(): void {
    this.toggleSidebar.emit();
  }

  toggleProfileMenu(): void {
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
  }

  onProfileAction(item: ProfileMenuItem): void {
    if (item.action === 'logout') {
      console.log('Logout clicked');
    }
    this.isProfileMenuOpen = false;
  }

  @HostListener('document:click', ['$event'])
  closeMenuOnOutsideClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('[data-profile-anchor]')) {
      this.isProfileMenuOpen = false;
    }
  }

  private readPageTitle(): string {
    let route = this.router.routerState.snapshot.root;
    let title = 'Home';
    let fullPath = '';
    while (route.firstChild) {
      route = route.firstChild;
      if (route.routeConfig && route.routeConfig.path) {
        fullPath += '/' + route.routeConfig.path;
      }
      const t = route.data['title'] as string | undefined;
      if (t) title = t;
    }
    // If the route is under /app/settings, always show 'Settings' as the main header title
    if (fullPath.startsWith('/app/settings')) {
      return 'Settings';
    }
    return title;
  }
}
