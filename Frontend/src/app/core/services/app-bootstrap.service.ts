import { Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';
import { ProfileService } from './profile.service';
import type { AuthUser } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AppBootstrapService {
  readonly isLoading = signal(false);
  private readonly debugLoaderDelayMs = 3000;

  private initializedUserId: number | null = null;
  private initPromise: Promise<void> | null = null;

  constructor(
    private readonly authService: AuthService,
    private readonly profileService: ProfileService
  ) {}

  async ensureInitialized(): Promise<void> {
    const user = this.authService.currentUserValue;

    if (!user) {
      this.initializedUserId = null;
      this.isLoading.set(false);
      return;
    }

    if (this.initializedUserId === user.id) {
      await this.initPromise;
      return;
    }

    if (this.initPromise) {
      await this.initPromise;
      return;
    }

    this.isLoading.set(true);

    const startedAt = Date.now();

    this.initPromise = firstValueFrom(this.profileService.getMyProfile())
      .then(async (profile) => {
        await this.authService.updateStoredUser(profile as AuthUser);
        this.initializedUserId = profile.id;

        const elapsedMs = Date.now() - startedAt;
        const remainingDelayMs = Math.max(0, this.debugLoaderDelayMs - elapsedMs);
        if (remainingDelayMs > 0) {
          await this.wait(remainingDelayMs);
        }
      })
      .catch((error) => {
        console.error('Failed to bootstrap app settings', error);
        this.initializedUserId = user.id;
      })
      .finally(() => {
        this.isLoading.set(false);
        this.initPromise = null;
      });

    await this.initPromise;
  }

  private wait(durationMs: number): Promise<void> {
    return new Promise((resolve) => {
      window.setTimeout(resolve, durationMs);
    });
  }

  reset(): void {
    this.initializedUserId = null;
    this.initPromise = null;
    this.isLoading.set(false);
  }
}
