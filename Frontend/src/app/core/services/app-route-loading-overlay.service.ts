import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AppRouteLoadingOverlayService {
  private readonly document = inject(DOCUMENT);
  private pendingCount = 0;
  private clearTimer: ReturnType<typeof setTimeout> | null = null;

  begin(): () => void {
    this.pendingCount += 1;
    this.applyLoadingState(true);

    let released = false;
    return () => {
      if (released) {
        return;
      }

      released = true;
      this.pendingCount = Math.max(0, this.pendingCount - 1);
      if (this.pendingCount === 0) {
        this.scheduleClear();
      }
    };
  }

  private applyLoadingState(isLoading: boolean): void {
    const root = this.document.documentElement;
    if (this.clearTimer) {
      clearTimeout(this.clearTimer);
      this.clearTimer = null;
    }

    root.classList.toggle('forma-route-loading', isLoading);
  }

  private scheduleClear(): void {
    this.clearTimer = setTimeout(() => {
      this.clearTimer = null;
      if (this.pendingCount > 0) {
        return;
      }

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          this.document.documentElement.classList.remove('forma-route-loading');
        });
      });
    }, 120);
  }
}
