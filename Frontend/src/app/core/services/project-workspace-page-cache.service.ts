import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ProjectWorkspacePageCacheService {
  private readonly cache = new Map<string, unknown>();

  get<T>(key: string): T | null {
    return (this.cache.get(key) as T | undefined) ?? null;
  }

  set<T>(key: string, value: T): void {
    this.cache.set(key, value);
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clearProject(projectId: number): void {
    const prefix = `${projectId}:`;
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }
}
