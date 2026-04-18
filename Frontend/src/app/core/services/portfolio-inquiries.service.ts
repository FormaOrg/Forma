import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  PortfolioInquiriesPage,
  PortfolioInquiryItem,
  PortfolioInquiryStatus,
} from '../models/portfolio-inquiries.model';

@Injectable({ providedIn: 'root' })
export class PortfolioInquiriesService {
  private readonly baseUrl = `${environment.projectsApiUrl}/projects`;

  constructor(private readonly http: HttpClient) {}

  getInquiriesPage(projectId: number): Observable<PortfolioInquiriesPage> {
    return this.http.get<PortfolioInquiriesPage>(`${this.baseUrl}/${projectId}/inquiries`);
  }

  updateInquiryStatus(
    projectId: number,
    inquiryId: number,
    status: PortfolioInquiryStatus
  ): Observable<PortfolioInquiryItem> {
    return this.http.patch<PortfolioInquiryItem>(
      `${this.baseUrl}/${projectId}/inquiries/${inquiryId}/status`,
      { status: status.toUpperCase() }
    );
  }
}
