import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  ProjectBlogCategoryItem,
  ProjectBlogPostItem,
  ProjectBlogSubscriberItem,
} from '../models/project-blog-workspace.model';

@Injectable({ providedIn: 'root' })
export class ProjectBlogWorkspaceService {
  private readonly baseUrl = `${environment.apiUrl}/projects`;

  constructor(private readonly http: HttpClient) {}

  getPosts(projectId: number): Observable<ProjectBlogPostItem[]> {
    return this.http.get<ProjectBlogPostItem[]>(`${this.baseUrl}/${projectId}/posts`);
  }

  getCategories(projectId: number): Observable<ProjectBlogCategoryItem[]> {
    return this.http.get<ProjectBlogCategoryItem[]>(`${this.baseUrl}/${projectId}/categories`);
  }

  getSubscribers(projectId: number): Observable<ProjectBlogSubscriberItem[]> {
    return this.http.get<ProjectBlogSubscriberItem[]>(`${this.baseUrl}/${projectId}/subscribers`);
  }
}
