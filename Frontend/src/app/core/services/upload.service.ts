import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UploadResponse {
  url: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

@Injectable({ providedIn: 'root' })
export class UploadService {
  private readonly apiUrl = `${environment.apiUrl}/upload`;

  private readonly MAX_AVATAR_SIZE  = 5  * 1024 * 1024; // 5 MB
  private readonly MAX_MEDIA_SIZE   = 10 * 1024 * 1024; // 10 MB
  private readonly ALLOWED_TYPES    = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'
  ];

  constructor(private http: HttpClient) {}

  // ── User avatar ────────────────────────────────────────

  uploadAvatar(file: File): Observable<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<UploadResponse>(`${this.apiUrl}/avatar`, formData);
  }

  // ── Project media (images used inside site pages) ──────

  uploadProjectMedia(file: File, projectId: number): Observable<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('projectId', projectId.toString());
    return this.http.post<UploadResponse>(`${this.apiUrl}/media`, formData);
  }

  // ── Design asset (Figma-style visual designer) ─────────

  uploadDesignAsset(file: File, projectId: number): Observable<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('projectId', projectId.toString());
    return this.http.post<UploadResponse>(`${this.apiUrl}/design-asset`, formData);
  }

  // ── Delete ─────────────────────────────────────────────

  deleteFile(fileUrl: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}`, {
      params: { fileUrl }
    });
  }

  // ── Validation ─────────────────────────────────────────

  validateAvatar(file: File): ValidationResult {
    return this.validateFile(file, this.MAX_AVATAR_SIZE, 'Avatar');
  }

  validateMedia(file: File): ValidationResult {
    return this.validateFile(file, this.MAX_MEDIA_SIZE, 'Image');
  }

  private validateFile(file: File, maxSize: number, label: string): ValidationResult {
    if (!file) {
      return { valid: false, error: 'No file selected' };
    }
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      return { valid: false, error: `${label} must be JPEG, PNG, GIF or WebP` };
    }
    if (file.size > maxSize) {
      const mb = maxSize / (1024 * 1024);
      return { valid: false, error: `${label} must be under ${mb}MB` };
    }
    return { valid: true };
  }

  // ── Utilities ──────────────────────────────────────────

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  createPreviewUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) =>
        resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}