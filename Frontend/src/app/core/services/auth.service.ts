import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import {
  AuthUser,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
} from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = 'http://localhost:8081/api/auth';
  private currentUserSubject = new BehaviorSubject<AuthUser | null>(this.loadUserFromStorage());
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {}

  // ── Public state ───────────────────────────────────────

  get currentUser(): AuthUser | null {
    return this.currentUserSubject.value;
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    return !!token && !this.isTokenExpired(token);
  }

  getToken(): string | null {
    return localStorage.getItem('forma_token');
  }

  hasRole(role: string): boolean {
    return this.currentUser?.role === role;
  }

  isAdmin(): boolean {
    return this.hasRole('ADMIN');
  }

  isPremium(): boolean {
    return this.hasRole('PREMIUM') || this.isAdmin();
  }

  getCurrentUserId(): number {
    const token = this.getToken();
    if (!token) return 0;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.userId ?? 0;
    } catch {
      return 0;
    }
  }

  // ── Auth flows ─────────────────────────────────────────

  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, data).pipe(
      catchError(this.handleError)
    );
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => this.storeSession(response)),
      catchError(this.handleError)
    );
  }

  refreshToken(): Observable<AuthResponse> {
    const refreshToken = localStorage.getItem('forma_refresh_token');
    return this.http.post<AuthResponse>(`${this.apiUrl}/refresh`, { refreshToken }).pipe(
      tap(response => this.storeSession(response)),
      catchError(this.handleError)
    );
  }

  logout(): void {
    localStorage.removeItem('forma_token');
    localStorage.removeItem('forma_refresh_token');
    localStorage.removeItem('forma_user');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  forgotPassword(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/forgot-password`,
      { email }
    ).pipe(catchError(this.handleError));
  }

  resetPassword(token: string, newPassword: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/reset-password`,
      { token, newPassword }
    ).pipe(catchError(this.handleError));
  }

  // ── Private helpers ────────────────────────────────────

  private storeSession(response: AuthResponse): void {
    localStorage.setItem('forma_token', response.accessToken);
    localStorage.setItem('forma_refresh_token', response.refreshToken);
    localStorage.setItem('forma_user', JSON.stringify(response.user));
    this.currentUserSubject.next(response.user);
  }

  private loadUserFromStorage(): AuthUser | null {
    try {
      const stored = localStorage.getItem('forma_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return Math.floor(Date.now() / 1000) >= payload.exp;
    } catch {
      return true;
    }
  }

  private handleError(error: any): Observable<never> {
    console.error('AuthService error:', error);
    return throwError(() => error);
  }
  verifyEmail(token: string): Observable<{ message: string }> {
  return this.http.post<{ message: string }>(
    `${this.apiUrl}/verify-email`,
    { token }
  ).pipe(
    tap(() => {
      const user = this.currentUser;
      if (user) {
        const updated = { ...user, emailVerified: true };
        localStorage.setItem('forma_user', JSON.stringify(updated));
        this.currentUserSubject.next(updated);
      }
    }),
    catchError(this.handleError)
  );
}

resendVerificationEmail(email: string): Observable<{ message: string }> {
  return this.http.post<{ message: string }>(
    `${this.apiUrl}/resend-verification`,
    { email }
  ).pipe(catchError(this.handleError));
}

get currentUserValue(): AuthUser | null {
  return this.currentUser;
}
}