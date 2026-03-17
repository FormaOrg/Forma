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

  private lastScrollY = 0;
  private readonly scrollThreshold = 8;

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
