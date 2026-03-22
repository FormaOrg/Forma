// profile.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface UserProfileResponse {
  userId: number;
  username: string;
  email: string;
  displayName?: string;
  role: string;
  isActive: boolean;
  emailVerified: boolean;
  memberSince: string;
  lastLogin?: string;
  
  avatarUrl?: string;
  coverImageUrl?: string;
  bio?: string;
  occupation?: string;
  location?: string;
  
  website?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  
  totalArticleViews: number;
  totalArticlesPublished: number;
  profileViews: number;
  
  recentArticles?: ArticleSummary[];
}

export interface ArticleSummary {
  id: number;
  title: string;
  coverImageUrl?: string;
  category?: string;
  viewCount: number;
  status: string;
  createdAt: string;
}

export interface UserStatsResponse {
  userId: number;
  username: string;
  totalArticles: number;
  publishedArticles: number;
  draftArticles: number;
  totalArticleViews: number;
  averageViewsPerArticle: number;
  profileViews: number;
  lastArticleCreated?: string;
  lastLogin?: string;
  memberSince: string;
  mostViewedArticle?: PopularArticle;
}

export interface PopularArticle {
  id: number;
  title: string;
  category: string;
  viewCount: number;
  createdAt: string;
}

export interface UpdateProfileRequest {
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  coverImageUrl?: string;
  bio?: string;
  occupation?: string;
  location?: string;
  website?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
}

export interface AuditLogResponse {
  id: number;
  username: string;
  actionType: string;
  description: string;
  ipAddress: string;
  userAgent: string;
  resourceType?: string;
  resourceId?: number;
  success: boolean;
  errorMessage?: string;
  createdAt: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private apiUrl = 'http://localhost:8081/api/profile';
  private auditUrl = 'http://localhost:8081/api/audit';

  constructor(private http: HttpClient) {}

  getMyProfile(includeArticles: boolean = true): Observable<UserProfileResponse> {
    const params = new HttpParams().set('includeArticles', includeArticles.toString());
    return this.http.get<UserProfileResponse>(`${this.apiUrl}/me`, { params });
  }

  getUserProfile(username: string, includeArticles: boolean = true): Observable<UserProfileResponse> {
    const params = new HttpParams().set('includeArticles', includeArticles.toString());
    return this.http.get<UserProfileResponse>(`${this.apiUrl}/${username}`, { params });
  }

  updateMyProfile(request: UpdateProfileRequest): Observable<UserProfileResponse> {
    return this.http.put<UserProfileResponse>(`${this.apiUrl}/me`, request);
  }

  getMyStats(): Observable<UserStatsResponse> {
    return this.http.get<UserStatsResponse>(`${this.apiUrl}/me/stats`);
  }

  getUserStats(username: string): Observable<UserStatsResponse> {
    return this.http.get<UserStatsResponse>(`${this.apiUrl}/${username}/stats`);
  }

  getMyAuditLogs(page: number = 0, size: number = 10): Observable<PageResponse<AuditLogResponse>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<PageResponse<AuditLogResponse>>(`${this.auditUrl}/me`, { params });
  }
}