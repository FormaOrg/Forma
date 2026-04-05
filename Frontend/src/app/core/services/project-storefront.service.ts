import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ProjectStorefront,
  PublishProjectStorefrontResponse,
  UpdateProjectStorefrontRequest,
} from '../models/project-storefront.model';

@Injectable({ providedIn: 'root' })
export class ProjectStorefrontService {
  private readonly baseUrl = `${environment.apiUrl}/projects`;

  constructor(private readonly http: HttpClient) {}

  getStorefront(projectId: number): Observable<ProjectStorefront> {
    return this.http.get<ProjectStorefront>(`${this.baseUrl}/${projectId}/storefront`);
  }

  updateStorefront(
    projectId: number,
    payload: UpdateProjectStorefrontRequest
  ): Observable<ProjectStorefront> {
    return this.http.put<ProjectStorefront>(`${this.baseUrl}/${projectId}/storefront`, payload);
  }

  publishStorefront(projectId: number): Observable<PublishProjectStorefrontResponse> {
    return this.http.post<PublishProjectStorefrontResponse>(
      `${this.baseUrl}/${projectId}/storefront/publish`,
      {}
    );
  }

  unpublishStorefront(projectId: number): Observable<ProjectStorefront> {
    return this.http.post<ProjectStorefront>(`${this.baseUrl}/${projectId}/storefront/unpublish`, {});
  }
}
