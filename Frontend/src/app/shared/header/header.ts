/*import { Component, signal } from '@angular/core';

type NavItem = {
  label: string;
  hasDropdown?: boolean;
};

@Component({
  selector: 'app-header',
  imports: [],
  templateUrl: './header.html',
  styleUrl: './header.css',
})

export class Header {
  readonly navItems = signal<NavItem[]>([
    { label: 'Product', hasDropdown: true },
    { label: 'Templates', hasDropdown: true },
    { label: 'Support', hasDropdown: true },
    { label: 'Pricing' }
  ]);
}*/

import { Component, HostListener, signal } from '@angular/core';

type NavItem = {
  label: string;
  hasDropdown?: boolean;
};

@Component({
  selector: 'app-header',
  imports: [],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  readonly navItems = signal<NavItem[]>([
    { label: 'Product', hasDropdown: true },
    { label: 'Templates', hasDropdown: true },
    { label: 'Support', hasDropdown: true },
    { label: 'Pricing' }
  ]);

  readonly isHidden = signal(false);
  currentWord = 'Build.';
  isAnimating = false;

  private words = ['Build', 'Create', 'Design'];
  private wordIndex = 0;
  private animationInterval: any;
  private logoEl: HTMLElement | null = null;

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
}
