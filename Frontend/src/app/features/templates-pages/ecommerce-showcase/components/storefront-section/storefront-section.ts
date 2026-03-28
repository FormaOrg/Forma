import { Component, OnInit, OnDestroy, ViewChild, ElementRef, signal } from '@angular/core';
import { LinkButton } from '../../../../../shared/components/link-button/link-button';

@Component({
  selector: 'app-ecommerce-storefront-section',
  imports: [LinkButton],
  templateUrl: './storefront-section.html',
  styleUrl: './storefront-section.css',
})
export class StorefrontSection implements OnInit, OnDestroy {
  @ViewChild('canvasImg', { static: true }) canvasImg!: ElementRef<HTMLImageElement>;
  @ViewChild('canvasEl', { static: true }) canvasEl!: ElementRef<HTMLElement>;

  readonly isPaused = signal(false);

  // Scroll stops as fractions of total scrollable distance (0 = top, 1 = bottom)
  private readonly stops = [0, 0.215, 0.39, 0.56, 0.77, 1];

  private currentStop = 0;
  private currentY = 0;
  private targetY = 0;
  private maxScroll = 0;
  private animFrameId = 0;
  private pauseTimer = 0;

  // Timing config
  private readonly PAUSE_AT_STOP = 900;    // ms paused at each stop
  private readonly RETURN_DURATION = 1200; // ms for scroll back to top
  private readonly PX_PER_MS = 0.15;       // controls scroll speed (lower = slower)

  ngOnInit(): void {
    const img = this.canvasImg.nativeElement;
    const start = () => {
      this.measure();
      this.scheduleNextStop();
    };
    if (img.complete && img.naturalHeight > 0) {
      start();
    } else {
      img.addEventListener('load', start, { once: true });
    }
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.animFrameId);
    clearTimeout(this.pauseTimer);
  }

  togglePause(): void {
    this.isPaused.update(v => !v);
    if (!this.isPaused()) {
      this.animateToTarget();
    } else {
      cancelAnimationFrame(this.animFrameId);
      clearTimeout(this.pauseTimer);
    }
  }

  private measure(): void {
    const img = this.canvasImg.nativeElement;
    const canvas = this.canvasEl.nativeElement;
    this.maxScroll = Math.max(0, img.offsetHeight - canvas.offsetHeight);
  }

  private scheduleNextStop(): void {
    if (this.isPaused()) return;

    this.currentStop++;

    if (this.currentStop >= this.stops.length) {
      this.returnToTop();
      return;
    }

    this.targetY = -(this.stops[this.currentStop] * this.maxScroll);
    this.animateToTarget();
  }

  private animateToTarget(): void {
    if (this.isPaused()) return;
    cancelAnimationFrame(this.animFrameId);

    const startY = this.currentY;
    const endY = this.targetY;
    const distance = Math.abs(endY - startY);
    const duration = distance / this.PX_PER_MS;
    let startTime: number | null = null;

    const step = (timestamp: number) => {
      if (this.isPaused()) return;
      if (!startTime) startTime = timestamp;

      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-in-out cubic
      const eased = progress < 0.5
        ? 4 * progress ** 3
        : 1 - (-2 * progress + 2) ** 3 / 2;

      this.currentY = startY + (endY - startY) * eased;
      this.applyTransform(this.currentY);

      if (progress < 1) {
        this.animFrameId = requestAnimationFrame(step);
      } else {
        this.currentY = endY;
        this.applyTransform(endY);
        this.pauseTimer = window.setTimeout(() => this.scheduleNextStop(), this.PAUSE_AT_STOP);
      }
    };

    this.animFrameId = requestAnimationFrame(step);
  }

  private returnToTop(): void {
    if (this.isPaused()) return;
    cancelAnimationFrame(this.animFrameId);

    const startY = this.currentY;
    const duration = this.RETURN_DURATION;
    let startTime: number | null = null;

    const step = (timestamp: number) => {
      if (this.isPaused()) return;
      if (!startTime) startTime = timestamp;

      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = progress < 0.5
        ? 4 * progress ** 3
        : 1 - (-2 * progress + 2) ** 3 / 2;

      this.currentY = startY * (1 - eased);
      this.applyTransform(this.currentY);

      if (progress < 1) {
        this.animFrameId = requestAnimationFrame(step);
      } else {
        this.currentY = 0;
        this.applyTransform(0);
        this.currentStop = 0;
        this.pauseTimer = window.setTimeout(() => this.scheduleNextStop(), 600);
      }
    };

    this.animFrameId = requestAnimationFrame(step);
  }

  private applyTransform(y: number): void {
    this.canvasImg.nativeElement.style.transform = `translateY(${y}px)`;
  }
}