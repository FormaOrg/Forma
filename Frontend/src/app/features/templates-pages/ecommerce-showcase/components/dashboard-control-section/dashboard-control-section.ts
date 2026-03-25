import { Component, computed, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LinkButton } from '../../../../../shared/components/link-button/link-button';

type ControlFeature = {
  title: string;
  description: string;
  image: string;
  imageAlt: string;
};

@Component({
  selector: 'app-ecommerce-dashboard-control-section',
  standalone: true,
  imports: [CommonModule, LinkButton],
  templateUrl: './dashboard-control-section.html',
  styleUrl: './dashboard-control-section.css',
})
export class DashboardControlSection implements OnInit, OnDestroy {
  readonly sectionTitle = 'One dashboard for\ntotal business control';

  readonly cycleDuration = 5000;
  readonly transitionDuration = 350;

  readonly features = signal<ControlFeature[]>([
    {
      title: 'Process orders at scale',
      description:
        'Accept payments and manage all fulfillment logistics for all your sales channels from start to finish.',
      image: 'assets/Ecommerce Showcase/Dashboard/orders.jpg',
      imageAlt: 'Orders dashboard preview',
    },
    {
      title: 'Ship easier with native solutions',
      description:
        'Buy and print discounted shipping labels from a variety of carriers directly from your dashboard.',
      image: 'assets/Ecommerce Showcase/Dashboard/shipping.jpg',
      imageAlt: 'Shipping dashboard preview',
    },
    {
      title: 'Automate your business',
      description:
        'Sync inventory for all channels, monitor stock levels, track top products and set triggered actions.',
      image: 'assets/Ecommerce Showcase/Dashboard/automation.jpg',
      imageAlt: 'Automation dashboard preview',
    },
    {
      title: 'Access the right data to drive sales',
      description:
        'Understand your data at a glance with reports, real-time analytics and AI-powered benchmarks.',
      image: 'assets/Ecommerce Showcase/Dashboard/analytics.jpg',
      imageAlt: 'Analytics dashboard preview',
    },
  ]);

  readonly activeIndex = signal<number>(0);
  readonly activeFeature = computed(() => this.features()[this.activeIndex()]);
  readonly isImageFading = signal<boolean>(false);

  private cycleTimeout: ReturnType<typeof setTimeout> | null = null;
  private transitionTimeout: ReturnType<typeof setTimeout> | null = null;
  private postTransitionTimeout: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.preloadImages();
    this.startCycle();
  }

  ngOnDestroy(): void {
    this.clearCycle();
    this.clearTransition();
    this.clearPostTransition();
  }

  setActive(index: number): void {
    if (index === this.activeIndex()) return;

    this.clearCycle();
    this.clearPostTransition();

    this.performTransition(index, () => {
      this.startCycle();
    });
  }

  private nextFeature(): void {
    const nextIndex = (this.activeIndex() + 1) % this.features().length;

    this.performTransition(nextIndex, () => {
      this.startCycle();
    });
  }

  private performTransition(newIndex: number, onComplete?: () => void): void {
    this.clearTransition();
    this.clearPostTransition();

    this.isImageFading.set(true);

    this.transitionTimeout = setTimeout(() => {
      this.activeIndex.set(newIndex);
      this.isImageFading.set(false);
      this.transitionTimeout = null;

      if (onComplete) {
        this.postTransitionTimeout = setTimeout(() => {
          onComplete();
          this.postTransitionTimeout = null;
        }, this.transitionDuration);
      }
    }, this.transitionDuration);
  }

  private startCycle(): void {
    this.clearCycle();

    this.cycleTimeout = setTimeout(() => {
      this.nextFeature();
    }, this.cycleDuration);
  }

  private clearCycle(): void {
    if (this.cycleTimeout) {
      clearTimeout(this.cycleTimeout);
      this.cycleTimeout = null;
    }
  }

  private clearTransition(): void {
    if (this.transitionTimeout) {
      clearTimeout(this.transitionTimeout);
      this.transitionTimeout = null;
    }
  }

  private clearPostTransition(): void {
    if (this.postTransitionTimeout) {
      clearTimeout(this.postTransitionTimeout);
      this.postTransitionTimeout = null;
    }
  }

  private preloadImages(): void {
    this.features().forEach((feature) => {
      const img = new Image();
      img.src = feature.image;
    });
  }
}