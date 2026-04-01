import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  effect,
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
import { I18nService } from '../../../features/landing-page/i18n/i18n.service';
import { TranslatePipe } from '../../../features/landing-page/i18n/translate.pipe';

type CommandGroup = 'Pages' | 'Actions';
type ResolvedCommandPaletteItem = CommandPaletteItem & { title: string; subtitle: string; hint?: string };

interface CommandPaletteItem {
  id: string;
  titleKey: string;
  subtitleKey: string;
  icon: AppIconName;
  group: CommandGroup;
  keywords: string[];
  route?: string;
  action?: 'toggle-sidebar' | 'logout';
  hintKey?: string;
}

@Component({
  selector: 'app-app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, AppIcon, FormsModule, TranslatePipe],
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
  private i18n = inject(I18nService);

  readonly pageTitle = signal(this.readPageTitle());
  readonly commandQuery = signal('');
  readonly highlightedIndex = signal(0);

  isProfileMenuOpen = false;
  isCommandPaletteOpen = false;

  search = {
    placeholderKey: 'app.header.search',
    shortcut: 'Ctrl K'
  };

  actionButtons: Array<HeaderActionButton & { labelKey: string }> = [
    { label: 'Upgrade plan', labelKey: 'app.header.actions.upgrade', variant: 'secondary', route: '/pricing' },
    { label: 'Hire a professional', labelKey: 'app.header.actions.hire', variant: 'primary', route: '/contact' }
  ];

  profile = {
    name: 'John Doe',
    role: 'Admin',
    avatar: 'https://i.pravatar.cc/100?img=12'
  };

  profileMenuItems: Array<ProfileMenuItem & { labelKey: string }> = [
    { label: 'Profile', labelKey: 'app.header.menu.profile', icon: 'user', action: 'profile', route: '/app/settings/profile' },
    { label: 'Billing', labelKey: 'app.header.menu.billing', icon: 'credit-card', action: 'billing', route: '/app/billing' },
    { label: 'Settings', labelKey: 'app.header.menu.settings', icon: 'settings', action: 'settings', route: '/app/settings' },
    { label: 'Help & Support', labelKey: 'app.header.menu.help', icon: 'help', action: 'help', route: '/contact' },
    { label: 'Log out', labelKey: 'app.header.menu.logout', icon: 'log-out', action: 'logout', danger: true }
  ];

  readonly iconSize = 20;
  readonly commandPaletteItems: CommandPaletteItem[] = [
    {
      id: 'go-home',
      titleKey: 'app.command.goHome.title',
      subtitleKey: 'app.command.goHome.subtitle',
      icon: 'home',
      group: 'Pages',
      route: '/app/home',
      keywords: ['home', 'dashboard', 'overview', 'landing']
    },
    {
      id: 'go-projects',
      titleKey: 'app.command.projects.title',
      subtitleKey: 'app.command.projects.subtitle',
      icon: 'folder',
      group: 'Pages',
      route: '/app/projects',
      keywords: ['projects', 'sites', 'workspace', 'project']
    },
    {
      id: 'go-templates',
      titleKey: 'app.command.templates.title',
      subtitleKey: 'app.command.templates.subtitle',
      icon: 'layout-grid',
      group: 'Pages',
      route: '/app/templates',
      keywords: ['templates', 'gallery', 'layouts', 'blocks']
    },
    {
      id: 'go-billing',
      titleKey: 'app.command.billing.title',
      subtitleKey: 'app.command.billing.subtitle',
      icon: 'credit-card',
      group: 'Pages',
      route: '/app/billing',
      keywords: ['billing', 'plan', 'payment', 'subscription']
    },
    {
      id: 'go-settings-profile',
      titleKey: 'app.command.settingsProfile.title',
      subtitleKey: 'app.command.settingsProfile.subtitle',
      icon: 'user',
      group: 'Pages',
      route: '/app/settings/profile',
      keywords: ['profile', 'name', 'account', 'email', 'settings']
    },
    {
      id: 'go-settings-security',
      titleKey: 'app.command.settingsSecurity.title',
      subtitleKey: 'app.command.settingsSecurity.subtitle',
      icon: 'shield',
      group: 'Pages',
      route: '/app/settings/security',
      keywords: ['security', 'password', '2fa', 'verification', 'recovery']
    },
    {
      id: 'go-settings-preferences',
      titleKey: 'app.command.settingsPreferences.title',
      subtitleKey: 'app.command.settingsPreferences.subtitle',
      icon: 'settings',
      group: 'Pages',
      route: '/app/settings/preferences',
      keywords: ['preferences', 'theme', 'language', 'settings']
    },
    {
      id: 'go-settings-activity',
      titleKey: 'app.command.settingsActivity.title',
      subtitleKey: 'app.command.settingsActivity.subtitle',
      icon: 'history',
      group: 'Pages',
      route: '/app/settings/activity',
      keywords: ['activity', 'history', 'sessions', 'login', 'settings']
    },
    {
      id: 'go-pricing',
      titleKey: 'app.command.upgrade.title',
      subtitleKey: 'app.command.upgrade.subtitle',
      icon: 'sparkles',
      group: 'Actions',
      route: '/pricing',
      keywords: ['pricing', 'upgrade', 'plan', 'premium'],
      hintKey: 'app.command.hint.openPage'
    },
    {
      id: 'go-contact',
      titleKey: 'app.command.contact.title',
      subtitleKey: 'app.command.contact.subtitle',
      icon: 'help',
      group: 'Actions',
      route: '/contact',
      keywords: ['contact', 'support', 'professional', 'help'],
      hintKey: 'app.command.hint.openPage'
    },
    {
      id: 'toggle-sidebar',
      titleKey: 'app.command.toggleSidebar.title',
      subtitleKey: 'app.command.toggleSidebar.subtitle',
      icon: 'panel-left',
      group: 'Actions',
      action: 'toggle-sidebar',
      keywords: ['sidebar', 'menu', 'navigation', 'toggle'],
      hintKey: 'app.command.hint.action'
    },
    {
      id: 'logout',
      titleKey: 'app.command.logout.title',
      subtitleKey: 'app.command.logout.subtitle',
      icon: 'log-out',
      group: 'Actions',
      action: 'logout',
      keywords: ['logout', 'sign out', 'session', 'exit'],
      hintKey: 'app.command.hint.action'
    }
  ];

  constructor() {
    effect(() => {
      this.i18n.lang();
      this.pageTitle.set(this.readPageTitle());
    });

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

  get filteredCommandItems(): ResolvedCommandPaletteItem[] {
    const query = this.commandQuery().trim().toLowerCase();
    const items = this.commandPaletteItems.map(item => this.translateCommandItem(item));

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

  get groupedCommandItems(): Array<{ group: CommandGroup; items: ResolvedCommandPaletteItem[] }> {
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

  executeCommand(item: ResolvedCommandPaletteItem): void {
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

  isCommandHighlighted(item: ResolvedCommandPaletteItem): boolean {
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
      return this.i18n.t('app.header.title.settings');
    }
    return this.translateRouteTitle(title);
  }

  private translateRouteTitle(title: string): string {
    switch (title) {
      case 'Home':
        return this.i18n.t('app.header.title.home');
      case 'Projects':
        return this.i18n.t('app.header.title.projects');
      case 'Templates':
        return this.i18n.t('app.header.title.templates');
      case 'Profile':
        return this.i18n.t('app.header.title.profile');
      case 'Billing':
        return this.i18n.t('app.header.title.billing');
      case 'Activity':
        return this.i18n.t('app.header.title.activity');
      case 'Preferences':
        return this.i18n.t('app.header.title.preferences');
      case 'Security':
        return this.i18n.t('app.header.title.security');
      default:
        return title;
    }
  }

  private translateCommandItem(item: CommandPaletteItem): ResolvedCommandPaletteItem {
    return {
      ...item,
      title: item.action === 'toggle-sidebar'
        ? this.i18n.t(this.sidebarCollapsed ? 'app.command.toggleSidebar.expand' : 'app.command.toggleSidebar.collapse')
        : this.i18n.t(item.titleKey),
      subtitle: this.i18n.t(item.subtitleKey),
      hint: item.hintKey ? this.i18n.t(item.hintKey) : undefined
    };
  }
}
