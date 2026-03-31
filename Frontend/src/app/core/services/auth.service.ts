import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { Router } from '@angular/router';
import {
  AuthUser,
  AuthResponse,
  LoginRequest,
  LoginVerificationRequest,
  RegisterRequest,
} from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = 'http://localhost:8081/api/auth';
  private readonly tokenKey = 'forma_token';
  private readonly refreshTokenKey = 'forma_refresh_token';
  private readonly userKey = 'forma_user';
  private readonly rememberKey = 'forma_remember_me';
  private readonly loginVerificationKey = 'forma_login_verification';
  private readonly sessionValidationTtlMs = 10000;
  private currentUserSubject = new BehaviorSubject<AuthUser | null>(this.loadUserFromStorage());
  currentUser$ = this.currentUserSubject.asObservable();
  private lastValidatedToken: string | null = null;
  private lastSessionValidationAt = 0;

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
    return this.readFromStorages(this.tokenKey);
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
      tap(response => {
        if (response.accessToken && response.refreshToken && response.user) {
          this.storeSession(response, credentials.rememberMe);
        }
      }),
      catchError(this.handleError)
    );
  }

  verifyLoginCode(data: LoginVerificationRequest, rememberMe?: boolean): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login/verify`, data).pipe(
      tap(response => {
        if (response.accessToken && response.refreshToken && response.user) {
          this.storeSession(response, rememberMe);
        }
      }),
      catchError(this.handleError)
    );
  }

  resendLoginCode(token: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/login-verification/resend`,
      { token }
    ).pipe(catchError(this.handleError));
  }

  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.readFromStorages(this.refreshTokenKey);
    return this.http.post<AuthResponse>(`${this.apiUrl}/refresh`, { refreshToken }).pipe(
      tap(response => this.storeSession(response)),
      catchError(this.handleError)
    );
  }

  logout(): void {
    this.clearSessionStorage(localStorage);
    this.clearSessionStorage(sessionStorage);
    sessionStorage.removeItem(this.loginVerificationKey);
    this.lastValidatedToken = null;
    this.lastSessionValidationAt = 0;
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

  applyAuthResponse(response: AuthResponse): void {
    if (response.accessToken && response.refreshToken && response.user) {
      this.storeSession(response);
    }
  }

  validateCurrentSession(): Observable<boolean> {
    const token = this.getToken();
    if (!token) {
      return of(false);
    }

    const now = Date.now();
    if (
      this.lastValidatedToken === token &&
      now - this.lastSessionValidationAt < this.sessionValidationTtlMs
    ) {
      return of(true);
    }

    return this.http.get<{ message: string }>('http://localhost:8081/api/users/me/session-valid').pipe(
      map(() => {
        this.lastValidatedToken = token;
        this.lastSessionValidationAt = now;
        return true;
      }),
      catchError(() => {
        this.logout();
        return of(false);
      })
    );
  }

  savePendingLoginVerification(payload: {
    token: string;
    email: string;
    message?: string;
    rememberMe: boolean;
    returnUrl?: string;
  }): void {
    sessionStorage.setItem(this.loginVerificationKey, JSON.stringify(payload));
  }

  getPendingLoginVerification(): {
    token: string;
    email: string;
    message?: string;
    rememberMe: boolean;
    returnUrl?: string;
  } | null {
    try {
      const stored = sessionStorage.getItem(this.loginVerificationKey);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  clearPendingLoginVerification(): void {
    sessionStorage.removeItem(this.loginVerificationKey);
  }

  // ── Private helpers ────────────────────────────────────

  private storeSession(response: AuthResponse, rememberMe?: boolean): void {
    if (!response.accessToken || !response.refreshToken || !response.user) {
      return;
    }

    const persistForLongTerm = rememberMe ?? this.isRememberedSession();
    const targetStorage = persistForLongTerm ? localStorage : sessionStorage;
    const otherStorage = persistForLongTerm ? sessionStorage : localStorage;

    this.clearSessionStorage(otherStorage);
    targetStorage.setItem(this.tokenKey, response.accessToken);
    targetStorage.setItem(this.refreshTokenKey, response.refreshToken);
    targetStorage.setItem(this.userKey, JSON.stringify(response.user));
    targetStorage.setItem(this.rememberKey, String(persistForLongTerm));
    this.lastValidatedToken = response.accessToken;
    this.lastSessionValidationAt = Date.now();
    this.currentUserSubject.next(response.user);
  }

  private loadUserFromStorage(): AuthUser | null {
    try {
      const stored = this.readFromStorages(this.userKey);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  private readFromStorages(key: string): string | null {
    return localStorage.getItem(key) ?? sessionStorage.getItem(key);
  }

  private clearSessionStorage(storage: Storage): void {
    storage.removeItem(this.tokenKey);
    storage.removeItem(this.refreshTokenKey);
    storage.removeItem(this.userKey);
    storage.removeItem(this.rememberKey);
  }

  private isRememberedSession(): boolean {
    return (
      localStorage.getItem(this.rememberKey) === 'true' ||
      sessionStorage.getItem(this.rememberKey) === 'true'
    );
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
        const storage = localStorage.getItem(this.userKey) ? localStorage : sessionStorage;
        storage.setItem(this.userKey, JSON.stringify(updated));
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
