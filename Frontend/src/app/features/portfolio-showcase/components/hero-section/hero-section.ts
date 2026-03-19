import { AfterViewInit, Component, computed, ElementRef, HostListener, NgZone, OnDestroy, signal, ViewChild } from '@angular/core';
import { LinkButton } from "../../../../shared/components/link-button/link-button";

@Component({
  selector: 'app-hero-section',
  imports: [LinkButton],
  templateUrl: './hero-section.html',
  styleUrl: './hero-section.css',
})
export class HeroSection {
  private readonly scrollY = signal(0);
 
  // How far down the page the grid section starts (approximate).
  // Cards start lifted by LIFT_AMOUNT px and settle to 0 as the user scrolls.
  private readonly LIFT_AMOUNT = 90;   // initial vertical offset in px
  private readonly SCROLL_START = 300; // scroll position where animation begins
  private readonly SCROLL_END = 700;   // scroll position where animation completes
 
  // Progress from 0 (not scrolled) to 1 (fully settled), clamped
  readonly progress = computed(() => {
    const raw = (this.scrollY() - this.SCROLL_START) / (this.SCROLL_END - this.SCROLL_START);
    return Math.min(1, Math.max(0, raw));
  });
 
  // Left card: starts at -LIFT_AMOUNT and -2deg, settles to 0
  readonly leftCardTransform = computed(() => {
    const p = this.progress();
    const y = this.LIFT_AMOUNT * (1 - p);        // 90 → 0
    const rotate = -2 * (1 - p);                  // -2deg → 0
    return `translateY(-${y}px) rotate(${rotate}deg)`;
  });
 
  // Right card: same but mirrored rotation
  readonly rightCardTransform = computed(() => {
    const p = this.progress();
    const y = this.LIFT_AMOUNT * (1 - p);         // 90 → 0
    const rotate = 2 * (1 - p);                   // 2deg → 0
    return `translateY(-${y}px) rotate(${rotate}deg)`;
  });
 
  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.scrollY.set(window.scrollY || 0);
  }
}
