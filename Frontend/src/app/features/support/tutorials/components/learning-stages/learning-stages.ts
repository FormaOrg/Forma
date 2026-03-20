import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  QueryList,
  ViewChildren
} from '@angular/core';
import { CommonModule } from '@angular/common';

interface StageCard {
  label: string;
  title: string;
  description: string;
  bg: string;
  iconType: 'create' | 'manage' | 'grow';
  progress: number;
  parts: number;
}

@Component({
  selector: 'app-learning-stages',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './learning-stages.html',
  styleUrls: ['./learning-stages.css']
})
export class LearningStages implements AfterViewInit {
  @ViewChildren('stageCard') stageCards!: QueryList<ElementRef<HTMLElement>>;

  introTitle = 'Know your stuff, no matter your stage';
  introText =
    "Find the right classes for you based on where you are in your journey, and where you're going next.";

  cards: StageCard[] = [
    {
      label: 'CREATION',
      title: 'CREATE\nYOUR WEBSITE',
      description:
        'Learn how to build and launch a wow-worthy website with courses and lessons on design, coding, CMS and more.',
      bg: '#4e8df6',
      iconType: 'create',
      progress: 0,
      parts: 5   // vertical-top, vertical-mid, vertical-bottom, left-arm, right-arm
    },
    {
      label: 'MANAGEMENT',
      title: 'MANAGE\nYOUR BUSINESS',
      description:
        'Run your day-to-day smoothly with classes on eCommerce, payments, managing client relationships and more.',
      bg: '#f5c400',
      iconType: 'manage',
      progress: 0,
      parts: 5   // top-left, top-right, center, bottom-left, bottom-right
    },
    {
      label: 'GROWTH',
      title: 'GROW\nYOUR BRAND',
      description:
        'Get ahead and stay ahead with classes on everything you need to move your business forward, from email marketing to social media and more.',
      bg: '#a77df0',
      iconType: 'grow',
      progress: 0,
      parts: 6   // head-h, head-v, step1, step2, step3, base
    }
  ];

  ngAfterViewInit(): void {
    setTimeout(() => this.updateScrollProgress(), 0);
  }

  @HostListener('window:scroll')
  @HostListener('window:resize')
  onWindowChange(): void {
    this.updateScrollProgress();
  }

  private updateScrollProgress(): void {
    if (!this.stageCards) return;

    this.stageCards.forEach((cardRef, index) => {
      const el = cardRef.nativeElement;
      const rect = el.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      const start = viewportHeight * 0.88;
      const end = viewportHeight * 0.18;

      const raw = (start - rect.top) / (start - end);
      const progress = Math.max(0, Math.min(1, raw));

      this.cards[index].progress = progress;
    });
  }

  getTitleLines(title: string): string[] {
    return title.split('\n');
  }

  isPartVisible(progress: number, index: number, total: number): boolean {
    const threshold = (index + 1) / (total + 1);
    return progress >= threshold * 0.95;
  }
}