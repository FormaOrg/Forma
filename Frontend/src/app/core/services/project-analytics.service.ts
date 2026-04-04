import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AnalyticsRangePreset, ProjectAnalyticsPageResponse } from '../models/project-analytics.model';

@Injectable({ providedIn: 'root' })
export class ProjectAnalyticsService {
  private readonly baseUrl = `${environment.apiUrl}/projects`;

  constructor(private readonly http: HttpClient) {}

  getAnalyticsPage(projectId: number, range: AnalyticsRangePreset): Observable<ProjectAnalyticsPageResponse> {
    const params = new HttpParams().set('range', range);
    return this.http.get<ProjectAnalyticsPageResponse>(`${this.baseUrl}/${projectId}/analytics`, { params });
  }
}
