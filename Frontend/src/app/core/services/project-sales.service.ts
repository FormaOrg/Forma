import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ProjectSalesPageResponse, ProjectSalesQuery } from '../models/project-sales.model';

@Injectable({ providedIn: 'root' })
export class ProjectSalesService {
  private readonly baseUrl = `${environment.apiUrl}/projects`;

  constructor(private readonly http: HttpClient) {}

  getSalesPage(projectId: number, query: ProjectSalesQuery): Observable<ProjectSalesPageResponse> {
    return this.http.get<ProjectSalesPageResponse>(`${this.baseUrl}/${projectId}/sales`, {
      params: this.buildParams(query),
    });
  }

  exportSalesOrders(projectId: number, query: ProjectSalesQuery): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${projectId}/sales/export`, {
      params: this.buildParams(query, false),
      responseType: 'blob',
    });
  }

  private buildParams(query: ProjectSalesQuery, includePagination = true): HttpParams {
    let params = new HttpParams()
      .set('range', query.range)
      .set('compare', String(query.compare))
      .set('sort', query.sort)
      .set('filter', query.filter);

    if (query.search?.trim()) {
      params = params.set('search', query.search.trim());
    }

    if (includePagination) {
      params = params.set('page', String(query.page)).set('size', String(query.size));
    }

    return params;
  }
}
