import {
  Component,
  Input,
  ElementRef,
  ViewChild,
  signal,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-video-player',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './video-player.html',
  styleUrl: './video-player.css',
})
export class VideoPlayer {
  @Input() src: string = '';
  @Input() poster: string = '';
  @Input() autoplay: boolean = false;
  @Input() loop: boolean = true;

  @ViewChild('videoEl') videoEl!: ElementRef<HTMLVideoElement>;  

  readonly isPlaying = signal(false);
  readonly isMuted = signal(true);
  readonly isHovered = signal(false);
  readonly showCenterBtn = signal(true);

  private hideTimeout: any;

  get video(): HTMLVideoElement {
    return this.videoEl.nativeElement;
  }

  togglePlay(): void {
    if (this.video.paused) {
      this.video.play();
      this.isPlaying.set(true);
      this.scheduleCenterBtnHide();
    } else {
      this.video.pause();
      this.isPlaying.set(false);
      this.showCenterBtn.set(true);
      clearTimeout(this.hideTimeout);
    }
  }

  toggleMute(event: Event): void {
    event.stopPropagation();
    this.video.muted = !this.video.muted;
    this.isMuted.set(this.video.muted);
  }

  onMouseEnter(): void {
    this.isHovered.set(true);
    if (this.isPlaying()) {
      this.showCenterBtn.set(true);
      this.scheduleCenterBtnHide();
    }
  }

  onMouseLeave(): void {
    this.isHovered.set(false);
    if (this.isPlaying()) {
      this.showCenterBtn.set(false);
    }
  }

  private scheduleCenterBtnHide(): void {
    clearTimeout(this.hideTimeout);
    this.hideTimeout = setTimeout(() => {
      if (this.isPlaying()) {
        this.showCenterBtn.set(false);
      }
    }, 2000);
  }

  onVideoEnded(): void {
    this.isPlaying.set(false);
    this.showCenterBtn.set(true);
  }
}