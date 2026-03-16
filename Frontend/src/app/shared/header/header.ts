import { Component, signal } from '@angular/core';

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
}
