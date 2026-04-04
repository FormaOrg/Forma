import { Component, HostListener } from '@angular/core';

@Component({
  selector: 'app-footer',
  imports: [],
  templateUrl: './footer.html',
  styleUrl: './footer.css',
})
export class Footer {
  protected isMobileFooter = false;
  protected openSections = new Set<string>();

  constructor() {
    this.syncFooterSections();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.syncFooterSections();
  }

  protected isSectionOpen(section: string): boolean {
    return !this.isMobileFooter || this.openSections.has(section);
  }

  protected toggleSection(section: string): void {
    if (!this.isMobileFooter) {
      return;
    }

    if (this.openSections.has(section)) {
      this.openSections.delete(section);
      return;
    }

    this.openSections.add(section);
  }

  private syncFooterSections(): void {
    this.isMobileFooter = window.innerWidth <= 640;

    if (!this.isMobileFooter) {
      this.openSections = new Set(['product', 'solutions', 'learn', 'support']);
    }
  }
}
