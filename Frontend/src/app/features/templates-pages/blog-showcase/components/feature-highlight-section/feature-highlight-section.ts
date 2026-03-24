import { Component, signal, computed } from '@angular/core';
import { LinkButton } from '../../../../../shared/components/link-button/link-button';

type FeatureItem = {
  title: string;
  description: string;
  image: string;
  bgColor: string;
};

@Component({
  selector: 'app-feature-highlight-section',
  imports: [LinkButton],
  templateUrl: './feature-highlight-section.html',
  styleUrl: './feature-highlight-section.css',
})
export class FeatureHighlightSection {
  readonly title = 'The powerful infrastructure\nbehind your blog';

  readonly features = signal<FeatureItem[]>([
    {
      title: 'Secure platform',
      description: 'Our world class experts and enterprise-grade security system work 24/7 so your audiences\' information will always be kept safe and secure.',
      image: 'assets/Blog Showcase/Features/security.svg',
      bgColor: "#101585"
    },
    {
      title: 'Reliable hosting',
      description: 'Your site is automatically backed up and built to handle any situation — from traffic spikes to outages — so you\'ll always be up and running.',
      image: 'assets/Blog Showcase/Features/hosting.svg',
      bgColor: "#faa85e"
    },
    {
      title: 'Faster loading',
      description: 'We have a performance-first culture, meaning our priority is providing the best user experience for you and your visitors, with faster loading sites that perform great on any device.',
      image: 'assets/Blog Showcase/Features/speed.svg',
      bgColor: "#d5ed8f"
    },
  ]);

  readonly activeIndex = signal<number>(0);

  readonly activeFeature = computed(() => this.features()[this.activeIndex()]);

  setActive(index: number): void {
    this.activeIndex.set(index);
  }
}