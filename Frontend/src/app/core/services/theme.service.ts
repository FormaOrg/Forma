import { Injectable, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

export type AppTheme = 'light' | 'dark' | 'system';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storageKey = 'forma_theme_preference';
  private readonly mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  private readonly router = inject(Router);
  readonly theme = signal<AppTheme>('light');
  readonly resolvedTheme = signal<'light' | 'dark'>('light');

  constructor() {
    const listener = () => {
      if (this.theme() === 'system') {
        this.applyResolvedTheme('system');
      }
    };

    if (typeof this.mediaQuery.addEventListener === 'function') {
      this.mediaQuery.addEventListener('change', listener);
    } else {
      this.mediaQuery.addListener(listener);
    }

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => this.applyResolvedTheme(this.theme()));
  }

  init(): void {
    const savedTheme = this.readSavedTheme();
    this.setTheme(savedTheme, false);
  }

  setTheme(theme: AppTheme, persist = true): void {
    this.theme.set(theme);
    if (persist) {
      localStorage.setItem(this.storageKey, theme);
    }
    this.applyResolvedTheme(theme);
  }

  getTheme(): AppTheme {
    return this.theme();
  }

  syncStoredTheme(theme: AppTheme): void {
    this.setTheme(theme);
  }

  private readSavedTheme(): AppTheme {
    const savedTheme = localStorage.getItem(this.storageKey);
    return savedTheme === 'dark' || savedTheme === 'system' ? savedTheme : 'light';
  }

  private applyResolvedTheme(theme: AppTheme): void {
    const preferredResolved = theme === 'system'
      ? (this.mediaQuery.matches ? 'dark' : 'light')
      : theme;
    const resolved = this.shouldUseAppTheme() ? preferredResolved : 'light';

    this.resolvedTheme.set(resolved);
    document.documentElement.dataset['theme'] = resolved;
    document.body.classList.toggle('theme-dark', resolved === 'dark');
    document.body.classList.toggle('theme-light', resolved === 'light');
    document.documentElement.style.colorScheme = resolved;
  }

  private shouldUseAppTheme(): boolean {
    return window.location.pathname.startsWith('/app');
  }
}
