import { Injectable } from '@angular/core';

import { PublicProjectDomainService } from './public-project-domain.service';

export type StorefrontRouteMode = 'domain' | 'path';

@Injectable({ providedIn: 'root' })
export class PublicStorefrontRouteService {
  constructor(private readonly publicProjectDomainService: PublicProjectDomainService) {}

  resolveProjectId(projectIdParam: string | null | undefined): number {
    const projectId = Number(projectIdParam ?? '0');
    if (Number.isFinite(projectId) && projectId > 0) {
      return projectId;
    }

    return this.publicProjectDomainService.currentProjectId();
  }

  resolveRouteMode(projectIdParam: string | null | undefined): StorefrontRouteMode {
    const projectId = Number(projectIdParam ?? '0');
    return Number.isFinite(projectId) && projectId > 0 ? 'path' : 'domain';
  }

  buildPath(projectId: number, routeMode: StorefrontRouteMode, path = ''): string {
    const normalizedPath = path.trim().replace(/^\/+|\/+$/g, '');
    const basePath = routeMode === 'domain' ? '/' : `/store/${projectId}`;

    if (!normalizedPath) {
      return basePath;
    }

    return `${basePath.replace(/\/$/, '')}/${normalizedPath}`;
  }

  buildUrl(
    projectId: number,
    routeMode: StorefrontRouteMode,
    path = '',
    queryParams?: Record<string, string | number | boolean | null | undefined>
  ): string {
    const url = this.buildPath(projectId, routeMode, path);
    if (!queryParams) {
      return url;
    }

    const searchParams = new URLSearchParams();
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '') {
        return;
      }

      searchParams.set(key, String(value));
    });

    const queryString = searchParams.toString();
    return queryString ? `${url}${url.includes('?') ? '&' : '?'}${queryString}` : url;
  }
}
