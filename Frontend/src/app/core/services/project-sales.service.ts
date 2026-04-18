import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateProjectOrderRequest,
  ProjectSalesOrderEditor,
  ProjectSalesPageResponse,
  ProjectSalesQuery,
  UpdateProjectOrderRequest
} from '../models/project-sales.model';

@Injectable({ providedIn: 'root' })
export class ProjectSalesService {
  private readonly baseUrl = `${environment.projectsApiUrl}/projects`;

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

  getOrder(projectId: number, orderId: number): Observable<ProjectSalesOrderEditor> {
    return this.http.get<ProjectSalesOrderEditor>(`${this.baseUrl}/${projectId}/sales/orders/${orderId}`);
  }

  createOrder(projectId: number, payload: CreateProjectOrderRequest): Observable<ProjectSalesOrderEditor> {
    return this.http.post<ProjectSalesOrderEditor>(`${this.baseUrl}/${projectId}/sales/orders`, payload);
  }

  updateOrder(
    projectId: number,
    orderId: number,
    payload: UpdateProjectOrderRequest
  ): Observable<ProjectSalesOrderEditor> {
    return this.http.put<ProjectSalesOrderEditor>(`${this.baseUrl}/${projectId}/sales/orders/${orderId}`, payload);
  }

  deleteOrders(projectId: number, orderIds: number[]): Observable<void> {
    return this.http.request<void>('DELETE', `${this.baseUrl}/${projectId}/sales/orders`, {
      body: { orderIds },
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
