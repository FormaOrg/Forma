import { Component, HostListener, signal } from '@angular/core';
import { RouterLink } from "@angular/router";

type NavItem = {
  label: string;
  hasDropdown?: boolean;
  url:string;
};

type LanguageOption = {
  code: string;
  label: string;
  nativeLabel: string;
  dir?: 'ltr' | 'rtl';
};

@Component({
  selector: 'app-header',
  imports: [RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  readonly navItems = signal<NavItem[]>([
    { label: 'Product', hasDropdown: true, url: "#"},
    { label: 'Templates', hasDropdown: true, url: "#" },
    { label: 'Support', hasDropdown: true, url: "#" },
    { label: 'Pricing', url: "pricing" }
  ]);

  readonly isHidden = signal(false);
  readonly isLanguageOpen = signal(false);
  readonly selectedLanguage = signal<LanguageOption>({
    code: 'en',
    label: 'English',
    nativeLabel: 'English',
    dir: 'ltr'
  });

  readonly languages = signal<LanguageOption[]>([
    { code: 'en', label: 'English', nativeLabel: 'English', dir: 'ltr' },
    { code: 'ar', label: 'Arabic', nativeLabel: 'العربية', dir: 'rtl' },
    { code: 'fr', label: 'French', nativeLabel: 'Français', dir: 'ltr' }
  ]);

  private lastScrollY = 0;
  private readonly scrollThreshold = 8;

  @HostListener('window:scroll')
  onWindowScroll(): void {
    if (this.isLanguageOpen()) {
      return;
    }

    const currentScrollY = window.scrollY || 0;

    if (currentScrollY <= 40) {
      this.isHidden.set(false);
      this.lastScrollY = currentScrollY;
      return;
    }

    const scrollingDown = currentScrollY > this.lastScrollY;
    const scrollingUp = currentScrollY < this.lastScrollY;
    const passedThreshold =
      Math.abs(currentScrollY - this.lastScrollY) > this.scrollThreshold;

    if (passedThreshold) {
      if (scrollingDown) {
        this.isHidden.set(true);
      } else if (scrollingUp) {
        this.isHidden.set(false);
      }

      this.lastScrollY = currentScrollY;
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeLanguageMenu();
  }

  toggleLanguageMenu(): void {
    const willOpen = !this.isLanguageOpen();
    this.isLanguageOpen.set(willOpen);

    if (willOpen) {
      this.isHidden.set(false);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }

  closeLanguageMenu(): void {
    if (!this.isLanguageOpen()) {
      return;
    }

    this.isLanguageOpen.set(false);
    document.body.style.overflow = '';
  }

  selectLanguage(language: LanguageOption): void {
    this.selectedLanguage.set(language);
    this.closeLanguageMenu();

    // later you can hook this into actual i18n switching
    console.log('Selected language:', language.code);
  }
}