import { DOCUMENT } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { AppBootstrapService } from './core/services/app-bootstrap.service';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ToastContainer } from './shared/components/toast-container/toast-container';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastContainer],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('Frontend');
  private readonly appBootstrapService = inject(AppBootstrapService);
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);
  private hasRouteActivated = false;
  private hasNavigationSettled = false;
  private hasMarkedAppReady = false;
  private rootInitComplete = false;
  private revealTimeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.hasNavigationSettled = this.router.navigated;

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed()
      )
      .subscribe(() => {
        this.hasNavigationSettled = true;
        this.tryMarkAppReady();
      });
  }

  async ngOnInit(): Promise<void> {
    try {
      if (this.shouldWaitForAppBootstrap()) {
        await this.appBootstrapService.ensureInitialized();
        return;
      }
    } catch (error) {
      console.error('Failed while preparing initial app shell', error);
    }

    this.rootInitComplete = true;
    this.tryMarkAppReady();
  }

  onRouteActivated(): void {
    this.hasRouteActivated = true;
    this.tryMarkAppReady();
  }

  private shouldWaitForAppBootstrap(): boolean {
    const pathname = this.document.location?.pathname ?? '/';
    return pathname === '/app' || pathname.startsWith('/app/');
  }

  private tryMarkAppReady(): void {
    if (this.hasMarkedAppReady || this.shouldWaitForAppBootstrap()) {
      return;
    }

    if (!this.rootInitComplete || !this.hasRouteActivated || !this.hasNavigationSettled) {
      return;
    }

    this.hasMarkedAppReady = true;
    this.revealTimeoutId = setTimeout(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          this.document.documentElement.classList.add('forma-app-ready');
        });
      });
    }, 450);
  }
}
