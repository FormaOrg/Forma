import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  EditorStorefrontPreviewSnapshot,
  PublicStorefrontAccountLoginRequest,
  PublicStorefrontAccountRegisterRequest,
  PublicStorefrontCustomerAccount,
  PublicCheckoutRequest,
  PublicCheckoutResponse,
  PublicStorefrontHome,
  PublicStorefrontProduct,
} from '../models/public-storefront.model';

@Injectable({ providedIn: 'root' })
export class PublicStorefrontService {
  private readonly baseUrl = `${environment.apiUrl}/public/projects`;
  private readonly previewBaseUrl = `${environment.apiUrl}/projects`;
  private readonly editorPreviewStoragePrefix = 'forma_storefront_preview_';

  constructor(private readonly http: HttpClient) {}

  getStorefront(projectId: number, options?: { preview?: boolean }): Observable<PublicStorefrontHome> {
    const snapshot = options?.preview ? this.readEditorPreviewSnapshot(projectId) : null;
    if (snapshot) {
      return of(snapshot.storefront);
    }

    const url = options?.preview
      ? `${this.previewBaseUrl}/${projectId}/storefront/preview`
      : `${this.baseUrl}/${projectId}/storefront`;
    return this.http.get<PublicStorefrontHome>(url);
  }

  getProducts(projectId: number, options?: { preview?: boolean }): Observable<PublicStorefrontProduct[]> {
    const snapshot = options?.preview ? this.readEditorPreviewSnapshot(projectId) : null;
    if (snapshot) {
      return of(snapshot.products);
    }

    const url = options?.preview
      ? `${this.previewBaseUrl}/${projectId}/storefront/preview/products`
      : `${this.baseUrl}/${projectId}/products`;
    return this.http.get<PublicStorefrontProduct[]>(url);
  }

  getProduct(projectId: number, productId: number, options?: { preview?: boolean }): Observable<PublicStorefrontProduct> {
    const snapshot = options?.preview ? this.readEditorPreviewSnapshot(projectId) : null;
    if (snapshot) {
      const product = snapshot.products.find((item) => item.id === productId);
      if (product) {
        return of(product);
      }
    }

    const url = options?.preview
      ? `${this.previewBaseUrl}/${projectId}/storefront/preview/products/${productId}`
      : `${this.baseUrl}/${projectId}/products/${productId}`;
    return this.http.get<PublicStorefrontProduct>(url);
  }

  checkout(projectId: number, payload: PublicCheckoutRequest): Observable<PublicCheckoutResponse> {
    return this.http.post<PublicCheckoutResponse>(`${this.baseUrl}/${projectId}/checkout`, payload);
  }

  registerAccount(projectId: number, payload: PublicStorefrontAccountRegisterRequest): Observable<PublicStorefrontCustomerAccount> {
    return this.http.post<PublicStorefrontCustomerAccount>(`${this.baseUrl}/${projectId}/account/register`, payload);
  }

  loginAccount(projectId: number, payload: PublicStorefrontAccountLoginRequest): Observable<PublicStorefrontCustomerAccount> {
    return this.http.post<PublicStorefrontCustomerAccount>(`${this.baseUrl}/${projectId}/account/login`, payload);
  }

  getAccount(projectId: number, sessionToken: string): Observable<PublicStorefrontCustomerAccount> {
    return this.http.get<PublicStorefrontCustomerAccount>(`${this.baseUrl}/${projectId}/account`, {
      headers: {
        'X-Storefront-Customer-Token': sessionToken,
      },
    });
  }

  logoutAccount(projectId: number, sessionToken: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${projectId}/account/logout`, null, {
      headers: {
        'X-Storefront-Customer-Token': sessionToken,
      },
    });
  }

  saveEditorPreviewSnapshot(projectId: number, snapshot: EditorStorefrontPreviewSnapshot): void {
    localStorage.setItem(this.getEditorPreviewStorageKey(projectId), JSON.stringify(snapshot));
  }

  readEditorPreviewSnapshot(projectId: number): EditorStorefrontPreviewSnapshot | null {
    try {
      const raw = localStorage.getItem(this.getEditorPreviewStorageKey(projectId));
      if (!raw) {
        return null;
      }

      return JSON.parse(raw) as EditorStorefrontPreviewSnapshot;
    } catch {
      return null;
    }
  }

  clearEditorPreviewSnapshot(projectId: number): void {
    localStorage.removeItem(this.getEditorPreviewStorageKey(projectId));
  }

  private getEditorPreviewStorageKey(projectId: number): string {
    return `${this.editorPreviewStoragePrefix}${projectId}`;
  }
}
