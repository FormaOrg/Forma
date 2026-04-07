import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject, EMPTY } from 'rxjs';
import { catchError, filter, switchMap, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshDone$ = new BehaviorSubject<boolean>(false);
  private readonly apiBaseUrl = environment.apiUrl.replace(/\/+$/, '');

  constructor(private authService: AuthService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const isApiRequest = this.isOwnedApiRequest(request.url);
    const token = this.authService.getToken();

    if (isApiRequest && token) {
      request = this.addToken(request, token);
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (!isApiRequest) {
          return throwError(() => error);
        }

        if (error.status === 401 && !request.url.includes('/auth/')) {
          return this.handle401(request, next);
        }
        if (error.status === 403 && !request.url.includes('/auth/') && this.authService.isLoggedIn()) {
          this.authService.logout();
          return EMPTY;
        }
        return throwError(() => error);
      })
    );
  }

  private isOwnedApiRequest(url: string): boolean {
    return url.startsWith(this.apiBaseUrl) || url.startsWith('/api/');
  }

  private addToken(request: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
    return request.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  private handle401(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (this.isRefreshing) {
      // Queue requests while refresh is in progress
      return this.refreshDone$.pipe(
        filter(done => done),
        take(1),
        switchMap(() => {
          const newToken = this.authService.getToken();
          return next.handle(this.addToken(request, newToken!));
        })
      );
    }

    this.isRefreshing = true;
    this.refreshDone$.next(false);

    return this.authService.refreshToken().pipe(
      switchMap(response => {
        if (!response.accessToken) {
          throw new Error('Refresh did not return a new access token');
        }
        this.isRefreshing = false;
        this.refreshDone$.next(true);
        return next.handle(this.addToken(request, response.accessToken));
      }),
      catchError(error => {
        this.isRefreshing = false;
        this.authService.logout(); // refresh failed — force logout
        return EMPTY;
      })
    );
  }
}
