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
    { label: 'Product', hasDropdown: true, url: "product"},
    { label: 'Solutions', hasDropdown: true, url: "#" },
    { label: 'Support', hasDropdown: true, url: "#" },
    { label: 'Pricing', url: "pricing" }
  ]);

  readonly isHidden = signal(false);
  currentWord = 'Build.';
  isAnimating = false;

  private words = ['Build', 'Create', 'Design'];
  private wordIndex = 0;
  private animationInterval: any;
  private logoEl: HTMLElement | null = null;
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

  ngOnInit() {
    this.logoEl = document.querySelector('.logo-link');
    this.startAnimation();
  }

  ngOnDestroy() {
      clearInterval(this.animationInterval);
  }

  startAnimation() {
    this.animationInterval = setInterval(() => {
        this.runCycle();
    }, 6000); // 3s word + 3s forma = 6s per full cycle
  }

  runCycle() {
    if (!this.logoEl) return;

    // show word for 3s
    this.currentWord = this.words[this.wordIndex];
    this.logoEl.classList.add('animating');

    setTimeout(() => {
        // return to Forma for 3s
        this.logoEl!.classList.remove('animating');

        // advance word index after returning
        setTimeout(() => {
            this.wordIndex = (this.wordIndex + 1) % this.words.length;
        }, 400); // wait for fade out to finish
    }, 3000); // word shows for 3s
  }

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