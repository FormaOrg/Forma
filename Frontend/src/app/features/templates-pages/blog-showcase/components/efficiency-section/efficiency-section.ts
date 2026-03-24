import { Component, computed, signal } from '@angular/core';
import { LinkButton } from "../../../../../shared/components/link-button/link-button";

type EfficiencyItem = {
  id: number;
  title: string;
  description: string;
  cta: string;
  image: string;
  bg: string;
};

@Component({
  selector: 'app-efficiency-section',
  imports: [LinkButton],
  templateUrl: './efficiency-section.html',
  styleUrl: './efficiency-section.css',
})
export class EfficiencySection {
  readonly items = signal<EfficiencyItem[]>([
    {
      id: 1,
      title: 'Schedule',
      description: 'Write when you feel inspired and schedule posts to go live at the best time for you.',
      cta: 'Get Started',
      image: 'assets/Blog Showcase/Efficiency/schedule.svg',
      bg: "#346674"
    },
    {
      id: 2,
      title: 'Collaborate',
      description: 'Give multiple writers and editors access to your blog platform so they can help manage your content.',
      cta: 'Get Started',
      image: 'assets/Blog Showcase/Efficiency/collaborate.svg',
      bg: '#346674'
    },
    {
      id: 3,
      title: 'Blog anywhere',
      description: 'Manage your blog content directly from your dashboard, anytime, anywhere.',
      cta: 'Get Started',
      image: 'assets/Blog Showcase/Efficiency/blog-anywhere.svg',
      bg: "#346674"
    },
  ]);
 
  // activeIndex  = the panel currently OPEN (drives flex: 1)
  // visibleIndex = the panel whose text/image are visible (drives opacity)
  // By setting visibleIndex to -1 first, content fades out BEFORE the panel slides
  readonly activeIndex  = signal<number>(0);
  readonly visibleIndex = signal<number>(0);
 
  private isAnimating = false;
 
  readonly activeItem = computed(() => this.items()[this.activeIndex()]);
 
  setActive(index: number): void {
    if (this.isAnimating) return;
    if (index === this.activeIndex()) {
      // clicking active tab → close it
      this.visibleIndex.set(-1);
      setTimeout(() => this.activeIndex.set(-1), 350);
      return;
    }
 
    this.isAnimating = true;
 
    // Step 1: hide content of current panel (opacity → 0)
    this.visibleIndex.set(-1);
 
    // Step 2: after content has faded out, slide the panel closed and open the new one
    setTimeout(() => {
      this.activeIndex.set(index);
 
      // Step 3: after the panel has expanded, reveal the new content
      setTimeout(() => {
        this.visibleIndex.set(index);
        this.isAnimating = false;
      }, 600); // matches panel transition duration
    }, 350); // matches content fade-out duration
  }
}
