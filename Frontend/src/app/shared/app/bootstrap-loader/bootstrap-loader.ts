import { Component, OnDestroy, OnInit, computed, inject } from '@angular/core';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-bootstrap-loader',
  standalone: true,
  templateUrl: './bootstrap-loader.html',
  styleUrl: './bootstrap-loader.css',
})
export class BootstrapLoader implements OnInit, OnDestroy {
  currentWord = 'Build';
  isAnimating = false;
  protected readonly isDarkMode = computed(() => this.themeService.resolvedTheme() === 'dark');

  private readonly words = ['Build', 'Create', 'Design'];
  private readonly themeService = inject(ThemeService);
  private wordIndex = 0;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private startTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private finishTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private advanceTimeoutId: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.startTimeoutId = setTimeout(() => {
      this.runCycle();
      this.intervalId = setInterval(() => this.runCycle(), 5200);
    }, 1200);
  }

  ngOnDestroy(): void {
    if (this.startTimeoutId) {
      clearTimeout(this.startTimeoutId);
    }
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    if (this.finishTimeoutId) {
      clearTimeout(this.finishTimeoutId);
    }
    if (this.advanceTimeoutId) {
      clearTimeout(this.advanceTimeoutId);
    }
  }

  private runCycle(): void {
    this.currentWord = this.words[this.wordIndex];
    this.isAnimating = true;

    if (this.finishTimeoutId) {
      clearTimeout(this.finishTimeoutId);
    }
    if (this.advanceTimeoutId) {
      clearTimeout(this.advanceTimeoutId);
    }

    this.finishTimeoutId = setTimeout(() => {
      this.isAnimating = false;
      this.advanceTimeoutId = setTimeout(() => {
        this.wordIndex = (this.wordIndex + 1) % this.words.length;
      }, 400);
    }, 3400);
  }
}
