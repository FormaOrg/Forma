import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { User, UserRole, UpdateProfileRequest } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly baseUrl = 'http://localhost:8081/api/users';

  constructor(private http: HttpClient) {}

  // ── Current user ───────────────────────────────────────

  getMe(): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/me`).pipe(
      catchError(this.handleError)
    );
  }

  updateMe(data: UpdateProfileRequest): Observable<User> {
    return this.http.put<User>(`${this.baseUrl}/me`, data).pipe(
      catchError(this.handleError)
    );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.baseUrl}/me/password`, {
      currentPassword,
      newPassword,
    }).pipe(catchError(this.handleError));
  }

  // ── Admin only ─────────────────────────────────────────

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.baseUrl).pipe(
      catchError(this.handleError)
    );
  }

  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  updateUserRole(id: number, role: UserRole): Observable<User> {
    return this.http.patch<User>(`${this.baseUrl}/${id}/role`, { role }).pipe(
      catchError(this.handleError)
    );
  }

  toggleUserActive(id: number): Observable<User> {
    return this.http.patch<User>(`${this.baseUrl}/${id}/toggle-active`, {}).pipe(
      catchError(this.handleError)
    );
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  // ── Batch (used internally by other services) ──────────

  getUsersByIds(ids: number[]): Observable<User[]> {
    return this.http.get<User[]>(`${this.baseUrl}/batch`, {
      params: { ids: ids.join(',') },
    }).pipe(catchError(this.handleError));
  }

  private handleError(error: any): Observable<never> {
    console.error('UserService error:', error);
    return throwError(() => error);
  }
}