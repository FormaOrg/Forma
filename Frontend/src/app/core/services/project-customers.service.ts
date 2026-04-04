import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateProjectCustomerRequest,
  ProjectCustomer,
  ProjectCustomersPage,
  ProjectCustomersQuery,
  UpdateProjectCustomerRequest,
} from '../models/project-customers.model';

@Injectable({ providedIn: 'root' })
export class ProjectCustomersService {
  private readonly baseUrl = `${environment.apiUrl}/projects`;

  constructor(private readonly http: HttpClient) {}

  getCustomersPage(projectId: number, query: ProjectCustomersQuery): Observable<ProjectCustomersPage> {
    let params = new HttpParams();

    if (query.search?.trim()) {
      params = params.set('search', query.search.trim());
    }
    if (query.zone?.trim() && query.zone !== 'ALL') {
      params = params.set('zone', query.zone.trim());
    }

    return this.http.get<ProjectCustomersPage>(`${this.baseUrl}/${projectId}/customers`, { params });
  }

  createCustomer(projectId: number, payload: CreateProjectCustomerRequest): Observable<ProjectCustomer> {
    return this.http.post<ProjectCustomer>(`${this.baseUrl}/${projectId}/customers`, payload);
  }

  updateCustomer(
    projectId: number,
    customerId: number,
    payload: UpdateProjectCustomerRequest
  ): Observable<ProjectCustomer> {
    return this.http.put<ProjectCustomer>(`${this.baseUrl}/${projectId}/customers/${customerId}`, payload);
  }

  deleteCustomer(projectId: number, customerId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/${projectId}/customers/${customerId}`);
  }
}
