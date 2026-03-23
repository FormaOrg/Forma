import { Component, computed, HostListener, signal } from '@angular/core';
import { LinkButton } from "../../../../../shared/components/link-button/link-button";

type ShowcaseItem = {
    image: string;
    alt: string;
};

@Component({
  selector: 'app-examples-section',
  imports: [LinkButton],
  templateUrl: './Examples-section.html',
  styleUrl: './Examples-section.css',
})
export class ExamplesSection {
  private readonly scrollY = signal(0);

  readonly topRow = signal<ShowcaseItem[]>([
      { image: 'assets/Portfolio Website Gallery/Examples/1.jpeg', alt: 'Website preview 1' },
      { image: 'assets/Portfolio Website Gallery/Examples/2.jpeg', alt: 'Website preview 2' },
      { image: 'assets/Portfolio Website Gallery/Examples/3.jpeg', alt: 'Website preview 3' },
      { image: 'assets/Portfolio Website Gallery/Examples/4.jpeg', alt: 'Website preview 4' },
  ]);

  readonly bottomRow = signal<ShowcaseItem[]>([
      { image: 'assets/Portfolio Website Gallery/Examples/5.jpeg', alt: 'Website preview 5' },
      { image: 'assets/Portfolio Website Gallery/Examples/6.jpeg', alt: 'Website preview 6' },
      { image: 'assets/Portfolio Website Gallery/Examples/7.jpeg', alt: 'Website preview 7' },
      { image: 'assets/Portfolio Website Gallery/Examples/8.jpeg', alt: 'Website preview 8' },
  ]);

  readonly topTransform = computed(() => {
      const scrollOffset = this.scrollY() * 0.12;
      const initialOffset = 1000;
      return `translate3d(${initialOffset - scrollOffset}px, 0, 0)`;
  });

  readonly bottomTransform = computed(() => {
      const scrollOffset = this.scrollY() * 0.12;
      const initialOffset = -1300;
      return `translate3d(${initialOffset + scrollOffset}px, 0, 0)`;
  });

  @HostListener('window:scroll')
  onWindowScroll(): void {
      this.scrollY.set(window.scrollY || 0);
  }
}