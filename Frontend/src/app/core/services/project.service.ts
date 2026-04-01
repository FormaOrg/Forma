import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  Project,
  CreateProjectRequest,
  UpdateProjectRequest,
  Deployment,
  DeployProjectRequest,
  Design,
  Media,
  TemplateRecord,
  Theme,
} from '../models/project.model';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private readonly baseUrl = `${environment.apiUrl}/projects`;

  constructor(private http: HttpClient) {}

  // ── Projects CRUD ──────────────────────────────────────

  getMyProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(this.baseUrl).pipe(
      catchError(this.handleError)
    );
  }

  getProjectById(id: number): Observable<Project> {
    return this.http.get<Project>(`${this.baseUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  createProject(data: CreateProjectRequest): Observable<Project> {
    return this.http.post<Project>(this.baseUrl, data).pipe(
      catchError(this.handleError)
    );
  }

  updateProject(id: number, data: UpdateProjectRequest): Observable<Project> {
    return this.http.put<Project>(`${this.baseUrl}/${id}`, data).pipe(
      catchError(this.handleError)
    );
  }

  deleteProject(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  duplicateProject(id: number): Observable<Project> {
    return this.http.post<Project>(`${this.baseUrl}/${id}/duplicate`, {}).pipe(
      catchError(this.handleError)
    );
  }

  publishProject(id: number): Observable<Project> {
    return this.http.patch<Project>(`${this.baseUrl}/${id}/publish`, {}).pipe(
      catchError(this.handleError)
    );
  }

  // ── Deployment ─────────────────────────────────────────

  deployProject(data: DeployProjectRequest): Observable<Deployment> {
    return this.http.post<Deployment>(
      `${this.baseUrl}/${data.projectId}/deploy`, data
    ).pipe(catchError(this.handleError));
  }

  getDeployment(projectId: number): Observable<Deployment> {
    return this.http.get<Deployment>(`${this.baseUrl}/${projectId}/deployment`).pipe(
      catchError(this.handleError)
    );
  }

  undeployProject(projectId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${projectId}/deployment`).pipe(
      catchError(this.handleError)
    );
  }

  // ── Design ─────────────────────────────────────────────

  getDesign(projectId: number): Observable<Design> {
    return this.http.get<Design>(`${this.baseUrl}/${projectId}/design`).pipe(
      catchError(this.handleError)
    );
  }

  saveDesign(projectId: number, design: Partial<Design>): Observable<Design> {
    return this.http.put<Design>(`${this.baseUrl}/${projectId}/design`, design).pipe(
      catchError(this.handleError)
    );
  }

  // ── Theme ──────────────────────────────────────────────

  getThemes(): Observable<Theme[]> {
    return this.http.get<Theme[]>(`${environment.apiUrl}/themes`).pipe(
      catchError(this.handleError)
    );
  }

  applyTheme(projectId: number, themeId: number): Observable<void> {
    return this.http.patch<void>(
      `${this.baseUrl}/${projectId}/theme`,
      { themeId }
    ).pipe(catchError(this.handleError));
  }

  getTemplates(): Observable<TemplateRecord[]> {
    return this.http.get<TemplateRecord[]>(`${environment.apiUrl}/templates`).pipe(
      catchError(this.handleError)
    );
  }

  // ── Media ──────────────────────────────────────────────

  getProjectMedia(projectId: number): Observable<Media[]> {
    return this.http.get<Media[]>(`${this.baseUrl}/${projectId}/media`).pipe(
      catchError(this.handleError)
    );
  }

  deleteMedia(projectId: number, mediaId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${projectId}/media/${mediaId}`).pipe(
      catchError(this.handleError)
    );
  }

  // ── Export (premium only) ──────────────────────────────

  exportSourceCode(projectId: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${projectId}/export`, {
      responseType: 'blob',
    }).pipe(catchError(this.handleError)) as Observable<Blob>;
  }

  private handleError(error: any): Observable<never> {
    console.error('ProjectService error:', error);
    return throwError(() => error);
  }
}
