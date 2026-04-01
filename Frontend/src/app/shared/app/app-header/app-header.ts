import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  inject,
  Input,
  Output,
  signal,
  ViewChild
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import type { HeaderActionButton, ProfileMenuItem } from '../dashboard-nav.types';
import { AppIcon } from '../icons/app-icon';
import type { AppIconName } from '../icons/app-icon';

type CommandGroup = 'Pages' | 'Actions';

interface CommandPaletteItem {
  id: string;
  title: string;
  subtitle: string;
  icon: AppIconName;
  group: CommandGroup;
  keywords: string[];
  route?: string;
  action?: 'toggle-sidebar' | 'logout';
  hint?: string;
}

@Component({
  selector: 'app-app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, AppIcon, FormsModule],
  templateUrl: './app-header.html',
  styleUrl: './app-header.css'
})
export class AppHeader {
  @Input() sidebarCollapsed = false;
  @Output() toggleSidebar = new EventEmitter<void>();
  @ViewChild('commandPaletteInput') commandPaletteInput?: ElementRef<HTMLInputElement>;
  @ViewChild('commandResults') commandResults?: ElementRef<HTMLDivElement>;

  private router = inject(Router);
  private authService = inject(AuthService);

  readonly pageTitle = signal(this.readPageTitle());
  readonly commandQuery = signal('');
  readonly highlightedIndex = signal(0);

  isProfileMenuOpen = false;
  isCommandPaletteOpen = false;

  search = {
    placeholder: 'Search...',
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
    { label: 'Profile', icon: 'user', action: 'profile', route: '/app/settings/profile' },
    { label: 'Billing', icon: 'credit-card', action: 'billing', route: '/app/billing' },
    { label: 'Settings', icon: 'settings', action: 'settings', route: '/app/settings' },
    { label: 'Help & Support', icon: 'help', action: 'help', route: '/contact' },
    { label: 'Log out', icon: 'log-out', action: 'logout', danger: true }
  ];

  readonly iconSize = 20;
  readonly commandPaletteItems: CommandPaletteItem[] = [
    {
      id: 'go-home',
      title: 'Go to Home',
      subtitle: 'Jump back to your dashboard home.',
      icon: 'home',
      group: 'Pages',
      route: '/app/home',
      keywords: ['home', 'dashboard', 'overview', 'landing']
    },
    {
      id: 'go-projects',
      title: 'Open Projects',
      subtitle: 'Browse and manage your projects.',
      icon: 'folder',
      group: 'Pages',
      route: '/app/projects',
      keywords: ['projects', 'sites', 'workspace', 'project']
    },
    {
      id: 'go-templates',
      title: 'Open Templates',
      subtitle: 'View your template area in the app.',
      icon: 'layout-grid',
      group: 'Pages',
      route: '/app/templates',
      keywords: ['templates', 'gallery', 'layouts', 'blocks']
    },
    {
      id: 'go-billing',
      title: 'Open Billing',
      subtitle: 'See plans, invoices, and payment settings.',
      icon: 'credit-card',
      group: 'Pages',
      route: '/app/billing',
      keywords: ['billing', 'plan', 'payment', 'subscription']
    },
    {
      id: 'go-settings-profile',
      title: 'Profile Settings',
      subtitle: 'Edit your personal information.',
      icon: 'user',
      group: 'Pages',
      route: '/app/settings/profile',
      keywords: ['profile', 'name', 'account', 'email', 'settings']
    },
    {
      id: 'go-settings-security',
      title: 'Security Settings',
      subtitle: 'Password, 2-step verification, and recovery.',
      icon: 'shield',
      group: 'Pages',
      route: '/app/settings/security',
      keywords: ['security', 'password', '2fa', 'verification', 'recovery']
    },
    {
      id: 'go-settings-preferences',
      title: 'Preferences',
      subtitle: 'Language, theme, and account preferences.',
      icon: 'settings',
      group: 'Pages',
      route: '/app/settings/preferences',
      keywords: ['preferences', 'theme', 'language', 'settings']
    },
    {
      id: 'go-settings-activity',
      title: 'Activity',
      subtitle: 'Check login history and active sessions.',
      icon: 'history',
      group: 'Pages',
      route: '/app/settings/activity',
      keywords: ['activity', 'history', 'sessions', 'login', 'settings']
    },
    {
      id: 'go-pricing',
      title: 'Upgrade Plan',
      subtitle: 'Compare plans and upgrade your workspace.',
      icon: 'sparkles',
      group: 'Actions',
      route: '/pricing',
      keywords: ['pricing', 'upgrade', 'plan', 'premium'],
      hint: 'Open page'
    },
    {
      id: 'go-contact',
      title: 'Hire a Professional',
      subtitle: 'Get in touch with Forma support or pros.',
      icon: 'help',
      group: 'Actions',
      route: '/contact',
      keywords: ['contact', 'support', 'professional', 'help'],
      hint: 'Open page'
    },
    {
      id: 'toggle-sidebar',
      title: this.sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar',
      subtitle: 'Toggle the dashboard navigation rail.',
      icon: 'panel-left',
      group: 'Actions',
      action: 'toggle-sidebar',
      keywords: ['sidebar', 'menu', 'navigation', 'toggle'],
      hint: 'Action'
    },
    {
      id: 'logout',
      title: 'Log Out',
      subtitle: 'End your current session and go back to login.',
      icon: 'log-out',
      group: 'Actions',
      action: 'logout',
      keywords: ['logout', 'sign out', 'session', 'exit'],
      hint: 'Action'
    }
  ];

  constructor() {
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed()
      )
      .subscribe(() => {
        this.pageTitle.set(this.readPageTitle());
        this.closeCommandPalette();
      });
  }

  get filteredCommandItems(): CommandPaletteItem[] {
    const query = this.commandQuery().trim().toLowerCase();
    const items = this.commandPaletteItems.map(item => ({
      ...item,
      title: item.action === 'toggle-sidebar'
        ? (this.sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar')
        : item.title
    }));

    if (!query) {
      return items;
    }

    return items.filter(item => {
      const haystack = [
        item.title,
        item.subtitle,
        ...item.keywords
      ].join(' ').toLowerCase();

      return haystack.includes(query);
    });
  }

  get groupedCommandItems(): Array<{ group: CommandGroup; items: CommandPaletteItem[] }> {
    const items = this.filteredCommandItems;
    return ['Pages', 'Actions']
      .map(group => ({
        group: group as CommandGroup,
        items: items.filter(item => item.group === group)
      }))
      .filter(section => section.items.length > 0);
  }

  onToggleSidebar(): void {
    this.toggleSidebar.emit();
  }

  toggleProfileMenu(): void {
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
  }

  onProfileAction(item: ProfileMenuItem): void {
    if (item.action === 'logout') {
      this.authService.logout();
    }
    this.isProfileMenuOpen = false;
  }

  openCommandPalette(): void {
    if (this.isCommandPaletteOpen) {
      return;
    }

    this.isCommandPaletteOpen = true;
    this.commandQuery.set('');
    this.highlightedIndex.set(0);
    this.focusCommandPaletteInput();
  }

  closeCommandPalette(): void {
    this.isCommandPaletteOpen = false;
    this.commandQuery.set('');
    this.highlightedIndex.set(0);
  }

  updateCommandQuery(value: string): void {
    this.commandQuery.set(value);
    this.highlightedIndex.set(0);
    this.scrollHighlightedCommandIntoView();
  }

  onCommandPaletteKeydown(event: KeyboardEvent): void {
    const items = this.filteredCommandItems;
    if (!items.length) {
      if (event.key === 'Escape') {
        event.preventDefault();
        this.closeCommandPalette();
      }
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.highlightedIndex.update(index => (index + 1) % items.length);
      this.scrollHighlightedCommandIntoView();
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.highlightedIndex.update(index => (index - 1 + items.length) % items.length);
      this.scrollHighlightedCommandIntoView();
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      this.executeCommand(items[this.highlightedIndex()]);
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      this.closeCommandPalette();
    }
  }

  executeCommand(item: CommandPaletteItem): void {
    if (item.route) {
      this.router.navigateByUrl(item.route);
      return;
    }

    if (item.action === 'toggle-sidebar') {
      this.onToggleSidebar();
      this.closeCommandPalette();
      return;
    }

    if (item.action === 'logout') {
      this.closeCommandPalette();
      this.authService.logout();
    }
  }

  private focusCommandPaletteInput(): void {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const input = this.commandPaletteInput?.nativeElement;
        if (!input) {
          return;
        }

        input.focus();
        input.select();
      });
    });
  }

  private scrollHighlightedCommandIntoView(): void {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const container = this.commandResults?.nativeElement;
        if (!container) {
          return;
        }

        const items = Array.from(
          container.querySelectorAll<HTMLElement>('.app-header__command-item')
        );
        const activeItem = items[this.highlightedIndex()];
        activeItem?.scrollIntoView({ block: 'nearest' });
      });
    });
  }

  isCommandHighlighted(item: CommandPaletteItem): boolean {
    return this.filteredCommandItems[this.highlightedIndex()]?.id === item.id;
  }

  @HostListener('document:click', ['$event'])
  closeMenuOnOutsideClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('[data-profile-anchor]')) {
      this.isProfileMenuOpen = false;
    }
  }

  @HostListener('document:keydown', ['$event'])
  handleGlobalShortcuts(event: KeyboardEvent): void {
    const target = event.target as HTMLElement | null;
    const isTypingTarget = !!target && (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    );

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      if (this.isCommandPaletteOpen) {
        this.closeCommandPalette();
      } else {
        this.openCommandPalette();
      }
      return;
    }

    if (this.isCommandPaletteOpen && event.key === 'Escape') {
      event.preventDefault();
      this.closeCommandPalette();
      return;
    }

    if (!this.isCommandPaletteOpen && !isTypingTarget && event.key === '/') {
      event.preventDefault();
      this.openCommandPalette();
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
