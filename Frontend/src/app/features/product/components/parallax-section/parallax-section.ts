import {
  AfterViewInit,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  ViewChild,
} from '@angular/core';

@Component({
  selector: 'app-parallax-section',
  templateUrl: './parallax-section.html',
  styleUrls: ['./parallax-section.css'],
})
export class ParallaxSection implements AfterViewInit, OnDestroy {
  @ViewChild('parallaxStage', { static: true })
  parallaxStage!: ElementRef<HTMLElement>;

  imageOneY = 0;
  imageTwoY = 0;
  imageThreeY = 0;
  titleY = 0;

  private targetImageOneY = 0;
  private targetImageTwoY = 0;
  private targetImageThreeY = 0;
  private targetTitleY = 0;

  private currentImageOneY = 0;
  private currentImageTwoY = 0;
  private currentImageThreeY = 0;
  private currentTitleY = 0;

  private ticking = false;
  private rafId = 0;
  private resizeTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(private ngZone: NgZone) {}

  ngAfterViewInit(): void {
    this.updateTargets();
    this.startAnimationLoop();

    this.ngZone.runOutsideAngular(() => {
      window.addEventListener('scroll', this.handleScroll, { passive: true });
      window.addEventListener('resize', this.handleResize, { passive: true });
    });
  }

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.handleScroll);
    window.removeEventListener('resize', this.handleResize);
    cancelAnimationFrame(this.rafId);

    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
  }

  private handleScroll = (): void => {
    if (!this.ticking) {
      this.ticking = true;
      requestAnimationFrame(() => {
        this.updateTargets();
        this.ticking = false;
      });
    }
  };

  private handleResize = (): void => {
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }

    this.resizeTimeout = setTimeout(() => {
      this.updateTargets();
    }, 50);
  };

  private updateTargets(): void {
    if (!this.parallaxStage?.nativeElement) return;

    const el = this.parallaxStage.nativeElement;
    const rect = el.getBoundingClientRect();
    const viewportHeight = window.innerHeight || 1;

    const elementCenter = rect.top + rect.height / 2;
    const viewportCenter = viewportHeight / 2;

    let progress = (viewportCenter - elementCenter) / viewportHeight;

    if (progress > 1.2) progress = 1.2;
    if (progress < -1.2) progress = -1.2;

    const base = progress * 240;

    this.targetImageOneY = base * 0.45;
    this.targetImageTwoY = base * 0.75;
    this.targetImageThreeY = base * 1.05;
    this.targetTitleY = base * 0.22;
  }

  private startAnimationLoop(): void {
    const animate = (): void => {
      const ease = 0.09;

      this.currentImageOneY += (this.targetImageOneY - this.currentImageOneY) * ease;
      this.currentImageTwoY += (this.targetImageTwoY - this.currentImageTwoY) * ease;
      this.currentImageThreeY += (this.targetImageThreeY - this.currentImageThreeY) * ease;
      this.currentTitleY += (this.targetTitleY - this.currentTitleY) * ease;

      this.ngZone.run(() => {
        this.imageOneY = this.round(this.currentImageOneY);
        this.imageTwoY = this.round(this.currentImageTwoY);
        this.imageThreeY = this.round(this.currentImageThreeY);
        this.titleY = this.round(this.currentTitleY);
      });

      this.rafId = requestAnimationFrame(animate);
    };

    this.ngZone.runOutsideAngular(() => {
      this.rafId = requestAnimationFrame(animate);
    });
  }

  private round(value: number): number {
    return Math.round(value * 100) / 100;
  }
}