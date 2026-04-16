import { Component, ElementRef, HostListener, ViewChild, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LinkButton } from '../../../../../shared/components/link-button/link-button';

@Component({
  selector: 'app-revenue-section',
  standalone: true,
  imports: [CommonModule, LinkButton],
  templateUrl: './revenue-section.html',
  styleUrl: './revenue-section.css',
})
export class RevenueSection {
  @ViewChild('scrollContainer') containerEl!: ElementRef<HTMLElement>;
  @ViewChild('strip')           stripEl!:     ElementRef<HTMLElement>;
 
  private readonly scrollY = signal(0);
  private maxShift = 0;
 
  readonly stripTransform = computed(() => {
    const sy = this.scrollY(); // read signal so computed re-runs on every scroll
    if (!this.maxShift || !this.containerEl) return 'translate3d(0, 0, 0)';
 
    const container = this.containerEl.nativeElement;
    const rect      = container.getBoundingClientRect();
    const viewH     = window.innerHeight;
 
    // scrollRange = containerHeight - viewH = the scroll room we added for animation
    const scrollRange = container.offsetHeight - viewH;
 
    // How far we've scrolled into the sticky zone
    // rect.top is 0 when container top is at viewport top (stuck)
    // progress = 0 at start of sticky, 1 at end
    const progress = Math.min(1, Math.max(0, -rect.top / scrollRange));
 
    const x = this.maxShift * progress;
    return `translate3d(-${x}px, 0, 0)`;
  });

  readonly cards = [
    {
      title: 'Sell your work',
      description: 'Add an online store to sell your digital and physical products, or sell print-on-demand merchandise branded with your designs.',
      bgColor: '#8B3A2A',
      textColor: '#ffffff',
      descColor: '#f0c9be',
      image: 'assets/Portfolio Website Gallery/Revenue/1.jpg',
    },
    {
      title: 'Offer services',
      description: 'Provide services with a full scheduling solution that allows you to instantly accept bookings and receive payments from your clients.',
      bgColor: '#ccf0a0',
      textColor: '#0d3d36',
      descColor: '#2a5a4a',
      image: 'assets/Portfolio Website Gallery/Revenue/2.jpg',
    },
    {
      title: 'Start a blog',
      description: 'Grow your community and drive traffic to your site, or monetize it by offering paid subscriptions to access your content.',
      bgColor: '#c5c5f5',
      textColor: '#1a1a4a',
      descColor: '#3a3a7a',
      image: 'assets/Portfolio Website Gallery/Revenue/3.jpg',
    },
    {
      title: 'Host events',
      description: 'Sell, promote and manage your online or in-person events and workshops — right from your dashboard.',
      bgColor: '#f5f0a0',
      textColor: '#2a2000',
      descColor: '#5a4a00',
      image: 'assets/Portfolio Website Gallery/Revenue/4.jpg',
    },
  ];

  ngAfterViewInit(): void {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.measure();
      });
    });
  }
 
  private measure(): void {
    const container = this.containerEl?.nativeElement;
    const strip     = this.stripEl?.nativeElement;
    if (!container || !strip) return;
 
    // maxShift = how far the strip needs to travel
    // Use section inner width (container width - 160px padding)
    const innerWidth = container.clientWidth - 160;
    this.maxShift = Math.max(0, strip.scrollWidth - innerWidth);
 
    // Set container height = section natural height + scroll room for full animation
    // scroll room = maxShift / 0.5 — controls animation speed (higher divisor = slower)
    const sectionHeight = container.querySelector('.revenue-section')!
      ? (container.querySelector('.revenue-section') as HTMLElement).offsetHeight
      : 800;
 
    container.style.setProperty('--scroll-room', `${this.maxShift / 0.5}px`);
    container.style.height = `${sectionHeight + this.maxShift / 0.5}px`;
  }
 
  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.scrollY.set(window.scrollY || 0);
  }
 
  @HostListener('window:resize')
  onResize(): void {
    this.measure();
  }
}