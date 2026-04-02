import { Component, OnInit, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AppHeader } from '../../../shared/app/app-header/app-header';
import { SideBar } from '../../../shared/app/side-bar/side-bar';
import { SettingsSidebar } from '../../../shared/app/settings-sidebar/settings-sidebar';
import { SidebarStateService } from '../../../core/services/sidebar-state.service';
import { AppBootstrapService } from '../../../core/services/app-bootstrap.service';
import { BootstrapLoader } from '../../../shared/app/bootstrap-loader/bootstrap-loader';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    RouterOutlet,
    AppHeader,
    SideBar,
    SettingsSidebar,
    BootstrapLoader
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  private sidebarStateService = inject(SidebarStateService);
  private router = inject(Router);
  private themeService = inject(ThemeService);
  readonly appBootstrapService = inject(AppBootstrapService);
  isSettingsRoute = false;
  isImmersiveRoute = false;
  sidebarMotionReady = false;

  constructor() {
    this.syncRouteState(this.router.url);

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed()
      )
      .subscribe((event) => {
        this.syncRouteState(event.urlAfterRedirects);
      });
  }

  get sidebarCollapsed(): boolean {
    return this.sidebarStateService.isCollapsed;
  }

  ngOnInit(): void {
    void this.appBootstrapService.ensureInitialized();
    setTimeout(() => {
      this.sidebarMotionReady = true;
    }, 0);
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

  private syncRouteState(url: string): void {
    this.isSettingsRoute = this.checkIsSettingsRoute(url);
    this.isImmersiveRoute = this.readDeepestRouteDataFlag('immersive');
  }

  private readDeepestRouteDataFlag(key: string): boolean {
    let current = this.router.routerState.snapshot.root;

    while (current.firstChild) {
      current = current.firstChild;
    }

    return Boolean(current.data[key]);
  }
}
