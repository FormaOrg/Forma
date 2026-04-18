import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateProjectCatalogProductRequest,
  ProjectCatalogPage,
  ProjectCatalogProduct,
  ProjectCatalogQuery,
  UpdateProjectCatalogProductRequest,
} from '../models/project-catalog.model';

@Injectable({ providedIn: 'root' })
export class ProjectCatalogService {
  private readonly baseUrl = `${environment.projectsApiUrl}/projects`;

  constructor(private readonly http: HttpClient) {}

  getCatalogPage(projectId: number, query: ProjectCatalogQuery): Observable<ProjectCatalogPage> {
    let params = new HttpParams();

    if (query.search?.trim()) {
      params = params.set('search', query.search.trim());
    }

    if (query.status && query.status !== 'ALL') {
      params = params.set('status', query.status);
    }

    if (query.category?.trim()) {
      params = params.set('category', query.category.trim());
    }

    return this.http.get<ProjectCatalogPage>(`${this.baseUrl}/${projectId}/catalog`, { params });
  }

  createProduct(
    projectId: number,
    payload: CreateProjectCatalogProductRequest
  ): Observable<ProjectCatalogProduct> {
    return this.http.post<ProjectCatalogProduct>(`${this.baseUrl}/${projectId}/catalog`, payload);
  }

  updateProduct(
    projectId: number,
    productId: number,
    payload: UpdateProjectCatalogProductRequest
  ): Observable<ProjectCatalogProduct> {
    return this.http.put<ProjectCatalogProduct>(
      `${this.baseUrl}/${projectId}/catalog/${productId}`,
      payload
    );
  }

  deleteProduct(projectId: number, productId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/${projectId}/catalog/${productId}`);
  }
}
