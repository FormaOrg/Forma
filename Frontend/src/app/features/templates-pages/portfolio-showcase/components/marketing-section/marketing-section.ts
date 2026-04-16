import { Component, HostListener, signal, ElementRef, ViewChildren, QueryList, AfterViewInit } from '@angular/core';
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
    // Trigger an initial read so computed values are correct on load
    this.scrollY.set(window.scrollY || 0);
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.scrollY.set(window.scrollY || 0);
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.scrollY.set(window.scrollY || 0);
  }

  cardProgress(i: number): number {
    // Read the signal so Angular re-evaluates on scroll
    const _sy = this.scrollY();

    const els = this.rowElements?.toArray();
    if (!els?.[i]) return 0;

    const rect = els[i].nativeElement.getBoundingClientRect();
    const viewH = window.innerHeight;
    const rowH = rect.height; // 550px

    // rowCenter = distance from viewport top to the vertical center of this row
    const rowCenter = rect.top + rowH / 2;

    // Animation starts when the row center reaches the bottom of the viewport,
    // ends when it reaches the top — i.e. the row has fully crossed the screen.
    // We want the card to START sliding when the row is centered (rowCenter = viewH/2),
    // and FINISH when the row center is 20% from the top.
    const animStart = viewH * 0.75;  // row center is 75% down → begin
    const animEnd   = viewH * 0.25;  // row center is 25% down → finish

    const raw = (animStart - rowCenter) / (animStart - animEnd);
    return Math.min(1, Math.max(0, raw));
  }
}