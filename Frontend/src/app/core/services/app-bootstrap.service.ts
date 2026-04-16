import { Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';
import { ProfileService } from './profile.service';
import type { AuthUser } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AppBootstrapService {
  readonly isLoading = signal(false);

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

    this.initPromise = firstValueFrom(this.profileService.getMyProfile())
      .then(async (profile) => {
        await this.authService.updateStoredUser(profile as AuthUser);
        this.initializedUserId = profile.id;
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

  reset(): void {
    this.initializedUserId = null;
    this.initPromise = null;
    this.isLoading.set(false);
  }
}
