import { Component, HostListener, signal, computed } from '@angular/core';
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
  private readonly scrollY = signal(0);

  readonly cards = [
    {
      title: 'Sell your work',
      description: 'Add an online store to sell your digital and physical products, or sell print-on-demand merchandise branded with your designs.',
      bgColor: '#8B3A2A',
      textColor: '#ffffff',
      descColor: '#f0c9be',
      image: 'assets/portfolio/revenue/sell.jpg',
    },
    {
      title: 'Offer services',
      description: 'Provide services with a full scheduling solution that allows you to instantly accept bookings and receive payments from your clients.',
      bgColor: '#ccf0a0',
      textColor: '#0d3d36',
      descColor: '#2a5a4a',
      image: 'assets/portfolio/revenue/services.jpg',
    },
    {
      title: 'Start a blog',
      description: 'Grow your community and drive traffic to your site, or monetize it by offering paid subscriptions to access your content.',
      bgColor: '#c5c5f5',
      textColor: '#1a1a4a',
      descColor: '#3a3a7a',
      image: 'assets/portfolio/revenue/blog.jpg',
    },
    {
      title: 'Host events',
      description: 'Sell, promote and manage your online or in-person events and workshops — right from your dashboard.',
      bgColor: '#f5f0a0',
      textColor: '#2a2000',
      descColor: '#5a4a00',
      image: 'assets/portfolio/revenue/events.jpg',
    },
  ];

  // The strip slides from its initial offset (cards start off-screen right)
  // to 0 as scroll progresses through the section's trigger window
  readonly stripTransform = computed(() => {
    const sy = this.scrollY();
    const triggerStart = 2600;  // adjust to where this section sits on your page
    const triggerEnd   = 3800;
    const raw = (sy - triggerStart) / (triggerEnd - triggerStart);
    const progress = Math.min(1, Math.max(0, raw));

    // Maximum shift: enough to reveal all 4 cards
    // Each card is ~380px + 20px gap = 400px, so total overhang ≈ 1200px for 4 cards
    const maxShift = 900;
    const shift = maxShift * progress;
    return `translateX(-${shift}px)`;
  });

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.scrollY.set(window.scrollY || 0);
  }
}