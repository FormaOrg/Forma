import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PortfolioPagesPage } from '../models/portfolio-pages.model';

@Injectable({ providedIn: 'root' })
export class PortfolioPagesService {
  private readonly baseUrl = `${environment.apiUrl}/projects`;

  constructor(private readonly http: HttpClient) {}

  getPagesPage(projectId: number): Observable<PortfolioPagesPage> {
    return this.http.get<PortfolioPagesPage>(`${this.baseUrl}/${projectId}/pages`);
  }
}
