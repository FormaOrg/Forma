import { Component, HostListener, signal, computed, ElementRef, ViewChildren, QueryList, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LinkButton } from '../../../../../shared/components/link-button/link-button';

type MarketingRow = {
  title: string;
  description: string;
  image: string;
  reverse: boolean;
};

@Component({
  selector: 'app-marketing-section',
  standalone: true,
  imports: [CommonModule, LinkButton],
  templateUrl: './marketing-section.html',
  styleUrl: './marketing-section.css',
})
export class MarketingSection implements AfterViewInit {
  @ViewChildren('rowEl') rowElements!: QueryList<ElementRef<HTMLElement>>;

  private readonly scrollY = signal(0);

  // Stores the absolute top position of each row on the page
  // Populated after view init and recalculated on scroll
  private rowTops: number[] = [];

  readonly rows: MarketingRow[] = [
    {
      title: 'Promote across platforms',
      description: 'Attract the right audience by running Google and social ads, and connecting your social media accounts to promote your digital portfolio everywhere.',
      image: 'assets/Portfolio Website Gallery/Marketing/1.png',
      reverse: false,
    },
    {
      title: 'Master SEO and get visibility',
      description: 'Optimize for search engines and get step by step guidance with built-in SEO tools to make sure your portfolio gets found by the right people.',
      image: 'assets/Portfolio Website Gallery/Marketing/2.png',
      reverse: true,
    },
    {
      title: 'Stay connected with clients',
      description: 'Let people get in touch through a contact form, and create fully-designed email campaigns to connect with a larger audience.',
      image: 'assets/Portfolio Website Gallery/Marketing/3.png',
      reverse: false,
    },
  ];

  ngAfterViewInit(): void {
    this.measureRows();
  }

  private measureRows(): void {
    this.rowTops = this.rowElements.map(el => {
      // Absolute top = scrollY at this moment + getBoundingClientRect().top
      return window.scrollY + el.nativeElement.getBoundingClientRect().top;
    });
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.scrollY.set(window.scrollY || 0);
    // Re-measure on first few scrolls in case layout shifted after load
    if (this.rowTops.length === 0) {
      this.measureRows();
    }
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.measureRows();
  }

  // Progress: 0 when card is at top, 1 when card reaches bottom
  // Animation window: starts when the top of the row hits 80% of the viewport,
  // ends 400px later (enough scroll to feel smooth but not too slow)
  cardProgress(i: number): number {
    if (!this.rowTops[i]) return 0;

    const rowTop = this.rowTops[i];
    const viewH = window.innerHeight;
    const animWindow = 400;

    // Start when the row's top edge is at 80% down the viewport
    const triggerStart = rowTop - viewH * 0.5;
    const triggerEnd = triggerStart + animWindow;

    const raw = (this.scrollY() - triggerStart) / (triggerEnd - triggerStart);
    return Math.min(1, Math.max(0, raw));
  }
}