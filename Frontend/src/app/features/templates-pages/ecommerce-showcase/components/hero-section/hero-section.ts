import { Component, computed, HostListener, signal, ElementRef, ViewChild } from '@angular/core';
import { LinkButton } from '../../../../../shared/components/link-button/link-button';
import { VideoPlayer } from "../../../../../shared/components/video-player/video-player";

@Component({
  selector: 'app-ecommerce-hero-section',
  imports: [LinkButton, VideoPlayer],
  templateUrl: './hero-section.html',
  styleUrl: './hero-section.css',
})
export class HeroSection {
  @ViewChild('wrapEl') wrapEl!: ElementRef<HTMLElement>;
  @ViewChild(VideoPlayer) videoPlayer!: VideoPlayer;

  private hasAutoPlayed = false;

  private readonly scrollY = signal(0);

  readonly bottomTransform = computed(() => {
    const sy = this.scrollY(); // reactive dependency
    if (!this.wrapEl) return { padding: 450};

    const rect = this.wrapEl.nativeElement.getBoundingClientRect();

    // How far we've scrolled into the wrap (0 when wrap top hits viewport top)
    const scrolled = -rect.top;
    // Total scroll range = wrap height minus one viewport height
    const total = rect.height - window.innerHeight;
    // Progress: 0 (start) → 1 (end), clamped
    const progress = Math.min(Math.max(scrolled / total, 0), 1);

    // Side padding shrinks from 250px → 20px as video grows
    const padding = 300 * (1 - progress) + 150;

    return { padding };
  });

  @HostListener('window:scroll')
  onScroll(): void {
    this.scrollY.set(window.scrollY || 0);

    if (!this.wrapEl || !this.videoPlayer) return;

    const rect = this.wrapEl.nativeElement.getBoundingClientRect();

    const isFullyOut = rect.bottom <= 0 || rect.top >= window.innerHeight;

    if (!isFullyOut && this.videoPlayer.video.paused) {
      this.videoPlayer.video.play();
      this.videoPlayer.isPlaying.set(true);
    }

    if (isFullyOut) {
      this.videoPlayer.video.pause();
      this.videoPlayer.isPlaying.set(false);

      this.videoPlayer.video.muted = true;
      this.videoPlayer.isMuted.set(true);
    }
  }
}