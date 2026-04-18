import { DOCUMENT } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AppHeader } from '../../../shared/app/app-header/app-header';
import { SideBar } from '../../../shared/app/side-bar/side-bar';
import { ProjectSidebar } from '../../../shared/app/project-sidebar/project-sidebar';
import { SettingsSidebar } from '../../../shared/app/settings-sidebar/settings-sidebar';
import { SidebarStateService } from '../../../core/services/sidebar-state.service';
import { AppBootstrapService } from '../../../core/services/app-bootstrap.service';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    RouterOutlet,
    AppHeader,
    SideBar,
    ProjectSidebar,
    SettingsSidebar
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  private static readonly stylesheetId = 'dashboard-overrides-styles';
  private sidebarStateService = inject(SidebarStateService);
  private document = inject(DOCUMENT);
  private router = inject(Router);
  private themeService = inject(ThemeService);
  readonly appBootstrapService = inject(AppBootstrapService);
  isSettingsRoute = false;
  isImmersiveRoute = false;
  isProjectRoute = false;
  currentProjectId = '';
  sidebarMotionReady = false;
  private hasChildRouteActivated = false;
  private hasNavigationSettled = false;
  private hasMarkedAppReady = false;
  private revealTimeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.ensureDashboardStylesheet();
    this.syncShellRouteState(this.router.url);
    this.hasNavigationSettled = this.router.navigated;

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed()
      )
      .subscribe((event) => {
        this.syncShellRouteState(event.urlAfterRedirects);
        this.hasNavigationSettled = true;
        this.tryMarkAppReady();
      });
  }

  get sidebarCollapsed(): boolean {
    return this.sidebarStateService.isCollapsed;
  }

  ngOnInit(): void {
    void this.appBootstrapService.ensureInitialized().finally(() => {
      this.tryMarkAppReady();
    });
    setTimeout(() => {
      this.sidebarMotionReady = true;
    }, 0);
  }

  onChildRouteActivated(): void {
    this.hasChildRouteActivated = true;
    this.tryMarkAppReady();
  }

  toggleSidebar(): void {
    this.sidebarStateService.toggleCollapsed();
  }

  sidebarLogoSrc(): string {
    return this.themeService.resolvedTheme() === 'dark'
      ? 'assets/Logo/FormaLogoOnly-white.svg'
      : 'assets/Logo/FormaLogoOnly.svg';
  }

  private checkIsSettingsRoute(url: string): boolean {
    return url === '/app/settings' || url.startsWith('/app/settings/');
  }

  private checkIsProjectRoute(url: string): boolean {
    return /^\/app\/projects\/[^/]+(?:\/.*)?$/.test(url);
  }

  private readProjectId(url: string): string {
    const match = url.match(/^\/app\/projects\/([^/?#]+)/);
    return match?.[1] ?? '';
  }

  private syncShellRouteState(url: string): void {
    this.isSettingsRoute = this.checkIsSettingsRoute(url);
    this.isProjectRoute = this.checkIsProjectRoute(url);
    this.currentProjectId = this.isProjectRoute ? this.readProjectId(url) : '';
    this.isImmersiveRoute = this.readDeepestRouteDataFlag('immersive');
  }

  private readDeepestRouteDataFlag(key: string): boolean {
    let current = this.router.routerState.snapshot.root;

    while (current.firstChild) {
      current = current.firstChild;
    }

    return Boolean(current.data[key]);
  }

  private ensureDashboardStylesheet(): void {
    if (this.document.getElementById(Dashboard.stylesheetId)) {
      return;
    }

    const link = this.document.createElement('link');
    link.id = Dashboard.stylesheetId;
    link.rel = 'stylesheet';
    link.href = '/dashboard-overrides.css';
    this.document.head.appendChild(link);
  }

  private tryMarkAppReady(): void {
    if (
      this.hasMarkedAppReady ||
      !this.hasChildRouteActivated ||
      !this.hasNavigationSettled ||
      this.appBootstrapService.isLoading()
    ) {
      return;
    }

    this.hasMarkedAppReady = true;
    this.revealTimeoutId = setTimeout(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          this.document.documentElement.classList.add('forma-app-ready');
        });
      });
    }, 700);
  }
}
