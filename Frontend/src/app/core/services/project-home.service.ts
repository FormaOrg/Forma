import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ProjectHomePage } from '../models/project-home.model';

@Injectable({ providedIn: 'root' })
export class ProjectHomeService {
  private readonly baseUrl = `${environment.apiUrl}/projects`;

  constructor(private readonly http: HttpClient) {}

  getHomePage(projectId: number): Observable<ProjectHomePage> {
    return this.http.get<ProjectHomePage>(`${this.baseUrl}/${projectId}/home`);
  }
}
