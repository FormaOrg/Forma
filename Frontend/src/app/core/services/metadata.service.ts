import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class MetadataService {
  private baseUrl = '/api/metadata';

  private statuses$:   Observable<string[]>;
  private categories$: Observable<string[]>;
  private tags$:       Observable<string[]>;

  constructor(private http: HttpClient) {
    this.statuses$   = this.http.get<string[]>(`${this.baseUrl}/statuses`).pipe(shareReplay(1));
    this.categories$ = this.http.get<string[]>(`${this.baseUrl}/categories`).pipe(shareReplay(1));
    this.tags$       = this.http.get<string[]>(`${this.baseUrl}/tags`).pipe(shareReplay(1));
  }

  getStatuses():   Observable<string[]> { return this.statuses$; }
  getCategories(): Observable<string[]> { return this.categories$; }
  getTags():       Observable<string[]> { return this.tags$; }
}