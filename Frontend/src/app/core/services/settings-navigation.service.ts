import { Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SettingsNavigationService {
  private initialized = false;
  private currentUrl: string | null = null;
  private returnUrl: string | null = null;

  constructor(private readonly router: Router) {}

  init(): void {
    if (this.initialized) {
      return;
    }

    this.initialized = true;
    this.currentUrl = this.router.url || null;

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(event => {
        const nextUrl = event.urlAfterRedirects;
        const previousUrl = this.currentUrl;
        const wasInSettings = this.isSettingsUrl(previousUrl);
        const isInSettings = this.isSettingsUrl(nextUrl);

        if (isInSettings && previousUrl && !wasInSettings) {
          this.returnUrl = previousUrl;
        }

        if (!isInSettings) {
          this.returnUrl = null;
        }

        this.currentUrl = nextUrl;
      });
  }

  getReturnUrl(fallback = '/app/home'): string {
    return this.returnUrl ?? fallback;
  }

  navigateBack(fallback = '/app/home'): Promise<boolean> {
    return this.router.navigateByUrl(this.getReturnUrl(fallback));
  }

  private isSettingsUrl(url: string | null | undefined): boolean {
    return !!url && (url === '/app/settings' || url.startsWith('/app/settings/'));
  }
}
