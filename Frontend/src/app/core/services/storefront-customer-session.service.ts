import { Injectable, computed, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class StorefrontCustomerSessionService {
  private readonly storagePrefix = 'forma_storefront_customer_session_';
  private readonly sessions = signal<Record<number, string>>({});

  readonly hasAnySession = computed(() => Object.keys(this.sessions()).length > 0);

  getSessionToken(projectId: number): string | null {
    if (!projectId) {
      return null;
    }

    const inMemory = this.sessions()[projectId];
    if (inMemory) {
      return inMemory;
    }

    const fromStorage = localStorage.getItem(this.getKey(projectId));
    if (fromStorage) {
      this.sessions.update((current) => ({ ...current, [projectId]: fromStorage }));
      return fromStorage;
    }

    return null;
  }

  setSessionToken(projectId: number, token: string): void {
    if (!projectId || !token) {
      return;
    }

    localStorage.setItem(this.getKey(projectId), token);
    this.sessions.update((current) => ({ ...current, [projectId]: token }));
  }

  clearSession(projectId: number): void {
    if (!projectId) {
      return;
    }

    localStorage.removeItem(this.getKey(projectId));
    this.sessions.update((current) => {
      const next = { ...current };
      delete next[projectId];
      return next;
    });
  }

  private getKey(projectId: number): string {
    return `${this.storagePrefix}${projectId}`;
  }
}
