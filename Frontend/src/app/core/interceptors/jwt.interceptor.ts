import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, switchMap, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshDone$ = new BehaviorSubject<boolean>(false);

  constructor(private authService: AuthService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = this.authService.getToken();

    if (token) {
      request = this.addToken(request, token);
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 && !request.url.includes('/auth/')) {
          return this.handle401(request, next);
        }
        return throwError(() => error);
      })
    );
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
        this.isRefreshing = false;
        this.refreshDone$.next(true);
        return next.handle(this.addToken(request, response.accessToken));
      }),
      catchError(error => {
        this.isRefreshing = false;
        this.authService.logout(); // refresh failed — force logout
        return throwError(() => error);
      })
    );
  }
}