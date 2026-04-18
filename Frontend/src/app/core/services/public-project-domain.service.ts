import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, finalize, shareReplay, tap } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { ResolvedPublicProject } from '../models/public-project.model';

@Injectable({ providedIn: 'root' })
export class PublicProjectDomainService {
  private readonly baseUrl = `${environment.apiUrl}/public/domains`;
  private readonly resolvedProjectState = signal<ResolvedPublicProject | null>(null);

  private resolvedHost: string | null = null;
  private currentRequest$: Observable<ResolvedPublicProject | null> | null = null;

  constructor(private readonly http: HttpClient) {}

  readonly resolvedProject = this.resolvedProjectState.asReadonly();

  resolveCurrentHost(options?: { force?: boolean }): Observable<ResolvedPublicProject | null> {
    const host = this.readCurrentHost();
    if (!host) {
      this.resolvedHost = null;
      this.resolvedProjectState.set(null);
      return of(null);
    }

    if (!options?.force && this.resolvedHost === host) {
      return of(this.resolvedProjectState());
    }

    if (!options?.force && this.currentRequest$) {
      return this.currentRequest$;
    }

    const request$ = this.http
      .get<ResolvedPublicProject>(`${this.baseUrl}/resolve`, {
        params: { host },
      })
      .pipe(
        tap((project) => {
          this.resolvedHost = host;
          this.resolvedProjectState.set(project);
        }),
        catchError(() => {
          this.resolvedHost = host;
          this.resolvedProjectState.set(null);
          return of(null);
        }),
        finalize(() => {
          this.currentRequest$ = null;
        }),
        shareReplay(1)
      );

    this.currentRequest$ = request$;
    return request$;
  }

  currentProjectId(): number {
    return this.resolvedProjectState()?.projectId ?? 0;
  }

  private readCurrentHost(): string {
    if (typeof window === 'undefined' || !window.location?.host) {
      return '';
    }

    return window.location.host.trim().toLowerCase();
  }
}
