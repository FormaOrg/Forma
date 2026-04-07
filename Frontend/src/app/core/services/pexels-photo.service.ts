import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../../environments/environment';

export interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  avg_color: string;
  alt: string;
  src: {
    original: string;
    large: string;
    large2x: string;
    medium: string;
    small: string;
    portrait: string;
    landscape: string;
    tiny: string;
  };
}

interface PexelsPhotoResponse {
  photos: PexelsPhoto[];
}

@Injectable({ providedIn: 'root' })
export class PexelsPhotoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'https://api.pexels.com/v1';
  private readonly apiKey = environment.pexelsApiKey?.trim() ?? '';

  hasApiKey(): boolean {
    return this.apiKey.length > 0;
  }

  getCuratedPhotos(perPage = 18): Observable<PexelsPhoto[]> {
    if (!this.hasApiKey()) {
      return of([]);
    }

    return this.http
      .get<PexelsPhotoResponse>(`${this.apiUrl}/curated`, {
        headers: this.buildHeaders(),
        params: new HttpParams().set('per_page', perPage),
      })
      .pipe(map((response) => response.photos ?? []));
  }

  searchPhotos(query: string, perPage = 18): Observable<PexelsPhoto[]> {
    if (!this.hasApiKey()) {
      return of([]);
    }

    return this.http
      .get<PexelsPhotoResponse>(`${this.apiUrl}/search`, {
        headers: this.buildHeaders(),
        params: new HttpParams().set('query', query).set('per_page', perPage),
      })
      .pipe(map((response) => response.photos ?? []));
  }

  private buildHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: this.apiKey,
    });
  }
}
