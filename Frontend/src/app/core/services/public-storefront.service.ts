import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  PublicCheckoutRequest,
  PublicCheckoutResponse,
  PublicStorefrontHome,
  PublicStorefrontProduct,
} from '../models/public-storefront.model';

@Injectable({ providedIn: 'root' })
export class PublicStorefrontService {
  private readonly baseUrl = `${environment.apiUrl}/public/projects`;

  constructor(private readonly http: HttpClient) {}

  getStorefront(projectId: number): Observable<PublicStorefrontHome> {
    return this.http.get<PublicStorefrontHome>(`${this.baseUrl}/${projectId}/storefront`);
  }

  getProducts(projectId: number): Observable<PublicStorefrontProduct[]> {
    return this.http.get<PublicStorefrontProduct[]>(`${this.baseUrl}/${projectId}/products`);
  }

  getProduct(projectId: number, productId: number): Observable<PublicStorefrontProduct> {
    return this.http.get<PublicStorefrontProduct>(`${this.baseUrl}/${projectId}/products/${productId}`);
  }

  checkout(projectId: number, payload: PublicCheckoutRequest): Observable<PublicCheckoutResponse> {
    return this.http.post<PublicCheckoutResponse>(`${this.baseUrl}/${projectId}/checkout`, payload);
  }
}
