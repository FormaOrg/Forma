import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { EMPTY, catchError } from 'rxjs';
import { environment } from '../../../environments/environment';

const SESSION_KEY = 'forma_analytics_sid';

@Injectable({ providedIn: 'root' })
export class StorefrontAnalyticsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/public/projects`;

  trackPageView(projectId: number, pagePath: string, pageTitle: string): void {
    if (typeof window === 'undefined') {
      return;
    }

    this.http
      .post<void>(`${this.baseUrl}/${projectId}/analytics/events`, {
        eventType: 'PAGE_VIEW',
        pagePath,
        pageTitle,
        sessionId: this.getOrCreateSessionId(),
        referrer: document.referrer || null,
      })
      .pipe(catchError(() => EMPTY))
      .subscribe();
  }

  private getOrCreateSessionId(): string {
    try {
      const existing = sessionStorage.getItem(SESSION_KEY);
      if (existing) {
        return existing;
      }

      const id = crypto.randomUUID();
      sessionStorage.setItem(SESSION_KEY, id);
      return id;
    } catch {
      return '';
    }
  }
}
