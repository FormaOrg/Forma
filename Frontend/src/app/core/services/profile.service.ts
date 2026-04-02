import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ActivitySession,
  AuthResponse,
  ChangePasswordRequest,
  ConfirmLoginVerificationChangeRequest,
  ConfirmEmailChangeRequest,
  LoginRecord,
  RequestLoginVerificationChangeRequest,
  RequestEmailChangeRequest,
  SensitiveActionVerificationResponse,
  SecuritySettingsResponse,
  UpdatePreferencesRequest,
  UpdateRecoveryOptionsRequest,
  UpdateProfileRequest
  ,
  UpdateSecurityQuestionsRequest,
  VerifySensitiveActionRequest,
  GoogleLinkRequest
} from '../models/user.model';

export interface UserProfileResponse {
  id: number;
  firstName: string;
  lastName: string;
  username?: string;
  email: string;
  phone?: string;
  country?: string;
  website?: string;
  avatarUrl?: string;
  googleConnected?: boolean;
  googleEmail?: string;
  preferredLanguage?: 'en' | 'fr';
  preferredTheme?: 'light' | 'dark' | 'system';
  role: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt?: string;
  updatedAt?: string;
  lastLogin?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private apiUrl = 'http://localhost:8081/api/users';

  constructor(private http: HttpClient) {}

  getMyProfile(): Observable<UserProfileResponse> {
    return this.http.get<UserProfileResponse>(`${this.apiUrl}/me`);
  }

  updateMyProfile(request: UpdateProfileRequest): Observable<UserProfileResponse> {
    return this.http.put<UserProfileResponse>(`${this.apiUrl}/me`, request);
  }

  updateMyPreferences(request: UpdatePreferencesRequest): Observable<UserProfileResponse> {
    return this.http.put<UserProfileResponse>(`${this.apiUrl}/me/preferences`, request);
  }

  linkGoogleAccount(request: GoogleLinkRequest): Observable<UserProfileResponse> {
    return this.http.post<UserProfileResponse>(`${this.apiUrl}/me/social/google/link`, request);
  }

  disableGoogleAccount(): Observable<UserProfileResponse> {
    return this.http.post<UserProfileResponse>(`${this.apiUrl}/me/social/google/disable`, {});
  }

  changeMyPassword(request: ChangePasswordRequest): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.apiUrl}/me/password`, request);
  }

  getMySecuritySettings(): Observable<SecuritySettingsResponse> {
    return this.http.get<SecuritySettingsResponse>(`${this.apiUrl}/me/security`);
  }

  verifySensitiveSecurityAction(request: VerifySensitiveActionRequest): Observable<SensitiveActionVerificationResponse> {
    return this.http.post<SensitiveActionVerificationResponse>(`${this.apiUrl}/me/security/verify`, request);
  }

  updateMySecurityQuestions(request: UpdateSecurityQuestionsRequest): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrl}/me/security-questions`, request);
  }

  updateMyRecoveryOptions(request: UpdateRecoveryOptionsRequest): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrl}/me/recovery-options`, request);
  }

  getMyActiveSessions(): Observable<ActivitySession[]> {
    return this.http.get<ActivitySession[]>(`${this.apiUrl}/me/activity/sessions`);
  }

  getMyLoginHistory(): Observable<LoginRecord[]> {
    return this.http.get<LoginRecord[]>(`${this.apiUrl}/me/activity/login-history`);
  }

  signOutMySession(sessionId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/me/activity/sessions/${sessionId}`);
  }

  signOutAllOtherSessions(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/me/activity/sessions/sign-out-others`, {});
  }

  requestLoginVerificationChange(request: RequestLoginVerificationChangeRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/me/login-verification/request`, request);
  }

  confirmLoginVerificationChange(request: ConfirmLoginVerificationChangeRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/me/login-verification/confirm`, request);
  }

  disableLoginVerification(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/me/login-verification/disable`, {});
  }

  requestEmailChange(request: RequestEmailChangeRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/me/email-change`, request);
  }

  confirmEmailChange(request: ConfirmEmailChangeRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/me/email-change/confirm`, request);
  }

  resendEmailChangeCode(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/me/email-change/resend`, {});
  }
}
