import { Component, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { LinkButton } from '../../../../../shared/components/link-button/link-button';

type FeatureItem = {
  title: string;
  description: string;
  image: string;
  bgColor: string;
};

@Component({
  selector: 'app-blog-feature-highlight-section',
  imports: [LinkButton],
  templateUrl: './feature-highlight-section.html',
  styleUrl: './feature-highlight-section.css',
})
export class FeatureHighlightSection implements OnInit, OnDestroy {
  readonly title = 'The powerful infrastructure\nbehind your blog';
  readonly cycleDuration = 5000;
  readonly transitionDuration = 350; // ms for fade out/in

  readonly features = signal<FeatureItem[]>([
    {
      title: 'Secure platform',
      description: "Our world class experts and enterprise-grade security system work 24/7 so your audiences' information will always be kept safe and secure.",
      image: 'assets/Blog Showcase/Features/security.svg',
      bgColor: '#101585',
    },
    {
      title: 'Reliable hosting',
      description: "Your site is automatically backed up and built to handle any situation — from traffic spikes to outages — so you'll always be up and running.",
      image: 'assets/Blog Showcase/Features/hosting.svg',
      bgColor: '#faa85e',
    },
    {
      title: 'Faster loading',
      description: 'We have a performance-first culture, meaning our priority is providing the best user experience for you and your visitors, with faster loading sites that perform great on any device.',
      image: 'assets/Blog Showcase/Features/speed.svg',
      bgColor: '#d5ed8f',
    },
  ]);

  readonly activeIndex = signal<number>(0);
  readonly activeFeature = computed(() => this.features()[this.activeIndex()]);
  
  // Controls the image opacity transition
  readonly isImageFading = signal<boolean>(false);

  private cycleTimeout: ReturnType<typeof setTimeout> | null = null;
  private transitionTimeout: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.preloadImages();
    this.startCycle();
  }

  ngOnDestroy(): void {
    this.clearCycle();
    this.clearTransition();
  }

  setActive(index: number): void {
    if (index === this.activeIndex()) return;
    
    // Stop auto-cycle while user interacts
    this.clearCycle();
    
    // Perform fade → swap → fade
    this.performTransition(index, () => {
      this.startCycle(); // Resume auto-cycle after transition
    });
  }

  private performTransition(newIndex: number, onComplete?: () => void): void {
    // Cancel any mid-transition if user clicks fast
    this.clearTransition();

    // 1. Fade out
    this.isImageFading.set(true);

    // 2. Wait for fade out, then swap data and fade in
    this.transitionTimeout = setTimeout(() => {
      this.activeIndex.set(newIndex);
      this.isImageFading.set(false);
      this.transitionTimeout = null;

      // 3. Notify cycle to continue after fade-in finishes
      if (onComplete) {
        setTimeout(onComplete, this.transitionDuration);
      }
    }, this.transitionDuration);
  }

  private nextFeature(): void {
    const nextIndex = (this.activeIndex() + 1) % this.features().length;
    this.performTransition(nextIndex, () => {
      this.startCycle();
    });
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
      this.isImageFading.set(false);
    }
  }

  private preloadImages(): void {
    // Preload so fade-in is instant, not blank while downloading
    this.features().forEach((feature) => {
      const img = new Image();
      img.src = feature.image;
    });
  }
}