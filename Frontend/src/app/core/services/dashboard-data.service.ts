import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';
import {
  BillingOverview,
  DashboardProjectItem,
  DashboardProjectStatus,
  DashboardTemplateItem,
} from '../models/dashboard.model';
import { CreationMethod, Project, ProjectType, TemplateRecord } from '../models/project.model';
import { AuthService } from './auth.service';
import { ProjectService } from './project.service';
import { ProjectWorkspaceContextService } from './project-workspace-context.service';
import { environment } from '../../../environments/environment';
import { parseServerDateToTimestamp } from '../utils/server-date.util';

@Injectable({ providedIn: 'root' })
export class DashboardDataService {
  private projectsOverviewCache$?: Observable<DashboardProjectItem[]>;
  private projectsOverviewCacheKey: string | null = null;
  private templatesOverviewCache$?: Observable<DashboardTemplateItem[]>;
  private templatesOverviewCacheKey: string | null = null;
  private billingOverviewCache$?: Observable<BillingOverview>;
  private billingOverviewCacheKey: string | null = null;

  constructor(
    private readonly http: HttpClient,
    private readonly projectService: ProjectService,
    private readonly authService: AuthService,
    private readonly projectWorkspaceContextService: ProjectWorkspaceContextService
  ) {}

  getProjectsOverview(options?: { useCache?: boolean }): Observable<DashboardProjectItem[]> {
    if (options?.useCache === false) {
      return this.fetchProjectsOverview();
    }

    const cacheKey = this.getCacheKey();
    if (!this.projectsOverviewCache$ || this.projectsOverviewCacheKey !== cacheKey) {
      this.projectsOverviewCacheKey = cacheKey;
      this.projectsOverviewCache$ = this.fetchProjectsOverview().pipe(
        catchError((error) => {
          this.projectsOverviewCache$ = undefined;
          this.projectsOverviewCacheKey = null;
          return throwError(() => error);
        }),
        shareReplay(1)
      );
    }

    return this.projectsOverviewCache$;
  }

  getBillingOverview(options?: { useCache?: boolean }): Observable<BillingOverview> {
    if (options?.useCache === false) {
      return this.fetchBillingOverview();
    }

    const cacheKey = this.getCacheKey();
    if (!this.billingOverviewCache$ || this.billingOverviewCacheKey !== cacheKey) {
      this.billingOverviewCacheKey = cacheKey;
      this.billingOverviewCache$ = this.fetchBillingOverview().pipe(
        catchError((error) => {
          this.billingOverviewCache$ = undefined;
          this.billingOverviewCacheKey = null;
          return throwError(() => error);
        }),
        shareReplay(1)
      );
    }

    return this.billingOverviewCache$;
  }

  getTemplatesOverview(options?: { useCache?: boolean }): Observable<DashboardTemplateItem[]> {
    if (options?.useCache === false) {
      return this.fetchTemplatesOverview();
    }

    const cacheKey = this.getCacheKey();
    if (!this.templatesOverviewCache$ || this.templatesOverviewCacheKey !== cacheKey) {
      this.templatesOverviewCacheKey = cacheKey;
      this.templatesOverviewCache$ = this.fetchTemplatesOverview().pipe(
        catchError((error) => {
          this.templatesOverviewCache$ = undefined;
          this.templatesOverviewCacheKey = null;
          return throwError(() => error);
        }),
        shareReplay(1)
      );
    }

    return this.templatesOverviewCache$;
  }

  invalidateProjectsOverviewCache(): void {
    this.projectsOverviewCache$ = undefined;
    this.projectsOverviewCacheKey = null;
  }

  invalidateTemplatesOverviewCache(): void {
    this.templatesOverviewCache$ = undefined;
    this.templatesOverviewCacheKey = null;
  }

  invalidateBillingOverviewCache(): void {
    this.billingOverviewCache$ = undefined;
    this.billingOverviewCacheKey = null;
  }

  invalidatePageCaches(): void {
    this.invalidateProjectsOverviewCache();
    this.invalidateTemplatesOverviewCache();
    this.invalidateBillingOverviewCache();
  }

  private fetchProjectsOverview(): Observable<DashboardProjectItem[]> {
    return this.projectService.getMyProjects().pipe(
      map((projects) => {
        this.projectWorkspaceContextService.setProjectTypes(
          projects.map((project) => ({ id: project.id, type: project.type }))
        );

        return projects.map((project) => this.toDashboardProject(project));
      })
    );
  }

  private fetchBillingOverview(): Observable<BillingOverview> {
    return this.http.get<BillingOverview>(`${environment.apiUrl}/billing/overview`);
  }

  private fetchTemplatesOverview(): Observable<DashboardTemplateItem[]> {
    return this.projectService.getTemplates().pipe(
      map((records) => this.toDashboardTemplates(records))
    );
  }

  private getCacheKey(): string {
    return String(this.authService.currentUserValue?.id ?? 'guest');
  }

  private toDashboardProject(project: Project): DashboardProjectItem {
    const createdAt = this.toTimestamp(project.createdAt);
    const updatedAt = this.toTimestamp(project.updatedAt ?? project.createdAt);
    const status = this.toProjectStatus(project.status);
    const currentUserId = this.authService.currentUserValue?.id ?? null;
    const isShared = currentUserId != null && project.ownerId !== currentUserId;

    return {
      id: String(project.id),
      backendId: project.id,
      name: project.name?.trim() || 'Untitled project',
      description: project.description?.trim() || `${this.toProjectTypeLabel(project.type)} project`,
      badgeLabel: isShared ? 'Shared' : undefined,
      isShared,
      status,
      statusLabel: this.toProjectStatusLabel(status),
      domain: undefined,
      liveUrl: undefined,
      previewUrl: undefined,
      thumbnailUrl: undefined,
      accent: this.colorFromSeed(`${project.id}-${project.type}`),
      route: `/app/projects/${project.id}`,
      previewRoute: undefined,
      metadata: `${this.toProjectTypeLabel(project.type)} · ${this.toCreationMethodLabel(project.creationMethod)}`,
      lastEditedLabel: this.formatRelativeDate(updatedAt),
      createdLabel: this.formatRelativeDate(createdAt),
      updatedDateLabel: this.formatAbsoluteDate(updatedAt),
      createdDateLabel: this.formatAbsoluteDate(createdAt),
      typeLabel: this.toProjectTypeLabel(project.type),
      creationMethodLabel: this.toCreationMethodLabel(project.creationMethod),
      lastEditedAt: updatedAt,
      createdAt,
    };
  }

  private toDashboardTemplates(records: TemplateRecord[]): DashboardTemplateItem[] {
    return records.map((record, index) =>
      this.toDashboardTemplate(record, index)
    ).sort((left, right) => {
      if (left.isFeatured !== right.isFeatured) {
        return Number(right.isFeatured) - Number(left.isFeatured);
      }

      if (left.usesCount !== right.usesCount) {
        return right.usesCount - left.usesCount;
      }

      return left.name.localeCompare(right.name);
    });
  }

  private toDashboardTemplate(
    record: TemplateRecord,
    index: number
  ): DashboardTemplateItem {
    const name = this.readNonEmptyString(record.name) ?? this.readNonEmptyString(record.title) ?? 'Untitled template';
    const description =
      this.readNonEmptyString(record.description) ?? this.readNonEmptyString(record.summary) ?? 'Published from your backend catalog.';
    const category = this.readNonEmptyString(record.category) ?? this.readNonEmptyString(record.label) ?? 'General';
    const projectType = this.toTemplateProjectType(record.projectType ?? record.type, 'LANDING_PAGE');
    const creationMethod = this.toTemplateCreationMethod(record.creationMethod, 'DRAG_DROP');
    const previewImageUrl = this.readNonEmptyString(record.previewImageUrl) ?? 'assets/Templates Gallery/Mock Templates/1.jpg';
    const previewRoute = this.resolveTemplatePreviewRoute(
      this.readNonEmptyString(record.previewRoute) ?? this.readNonEmptyString(record.route),
      projectType
    );
    const previewUrl = this.readNonEmptyString(record.previewUrl);
    const updatedAt = this.toTimestamp(record.updatedAt ?? record.createdAt);
    const usesCount =
      typeof record.usesCount === 'number' && Number.isFinite(record.usesCount) ? record.usesCount : 0;
    const isFeatured = typeof record.featured === 'boolean' ? record.featured : false;
    const isOwned = Boolean(record.isOwned);
    const tags = Array.isArray(record.tags)
      ? record.tags.filter((tag): tag is string => typeof tag === 'string' && tag.trim().length > 0)
      : [category];

    return {
      id: `template-${String(record.id)}`,
      backendId: record.id,
      name,
      description,
      category,
      categoryLabel: category,
      projectType,
      creationMethod,
      previewImageUrl,
      previewUrl,
      previewRoute,
      accent: this.colorFromSeed(`template-${String(record.id)}-${category}`),
      badgeLabel: isOwned ? 'My template' : isFeatured ? 'Featured' : undefined,
      source: 'backend',
      isFeatured,
      isOwned,
      tags,
      usesCount,
      usesLabel: `${usesCount} use${usesCount === 1 ? '' : 's'}`,
      updatedLabel: this.formatRelativeDate(updatedAt),
      updatedAt,
      sortIndex: index,
    };
  }

  private toProjectStatus(status: string | null | undefined): DashboardProjectStatus {
    switch ((status ?? '').toUpperCase()) {
      case 'PUBLISHED':
        return 'published';
      case 'ARCHIVED':
        return 'archived';
      default:
        return 'draft';
    }
  }

  private toProjectStatusLabel(status: DashboardProjectStatus): string {
    switch (status) {
      case 'published':
        return 'Published';
      case 'archived':
        return 'Archived';
      default:
        return 'Draft';
    }
  }

  private toProjectTypeLabel(type: string | null | undefined): string {
    return (type ?? 'PROJECT')
      .toLowerCase()
      .split('_')
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(' ');
  }

  private toCreationMethodLabel(method: string | null | undefined): string {
    return (method ?? 'MANUAL')
      .toLowerCase()
      .split('_')
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(' ');
  }

  private toTemplateProjectType(value: unknown, fallback: ProjectType): ProjectType {
    switch (this.readNonEmptyString(value)?.toUpperCase()) {
      case 'BLOG':
        return 'BLOG';
      case 'BUSINESS':
        return 'BUSINESS';
      case 'ECOMMERCE':
        return 'ECOMMERCE';
      case 'LANDING_PAGE':
        return 'LANDING_PAGE';
      case 'PORTFOLIO':
        return 'PORTFOLIO';
      default:
        return fallback;
    }
  }

  private toTemplateCreationMethod(value: unknown, fallback: CreationMethod): CreationMethod {
    switch (this.readNonEmptyString(value)?.toUpperCase()) {
      case 'AI_PROMPT':
        return 'AI_PROMPT';
      case 'DRAG_DROP':
        return 'DRAG_DROP';
      case 'GUIDED_SETUP':
        return 'GUIDED_SETUP';
      case 'HYBRID':
        return 'HYBRID';
      case 'QUICK_START':
        return 'QUICK_START';
      case 'VISUAL_DESIGNER':
        return 'VISUAL_DESIGNER';
      default:
        return fallback;
    }
  }

  private resolveTemplatePreviewRoute(
    route: string | undefined,
    projectType: ProjectType
  ): string | undefined {
    if (projectType === 'LANDING_PAGE') {
      if (!route || route === '/product') {
        return '/landing-page-website';
      }
    }

    return route;
  }

  private toTimestamp(value: string | null | undefined): number {
    const parsed = parseServerDateToTimestamp(value);
    return Number.isFinite(parsed) ? parsed : Date.now();
  }

  private formatRelativeDate(timestamp: number): string {
    const diffInMinutes = Math.round((timestamp - Date.now()) / 60000);
    const absoluteMinutes = Math.abs(diffInMinutes);
    const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

    if (absoluteMinutes < 60) {
      return formatter.format(diffInMinutes, 'minute');
    }

    const diffInHours = Math.round(diffInMinutes / 60);
    if (Math.abs(diffInHours) < 24) {
      return formatter.format(diffInHours, 'hour');
    }

    const diffInDays = Math.round(diffInHours / 24);
    if (Math.abs(diffInDays) < 30) {
      return formatter.format(diffInDays, 'day');
    }

    const diffInMonths = Math.round(diffInDays / 30);
    if (Math.abs(diffInMonths) < 12) {
      return formatter.format(diffInMonths, 'month');
    }

    return formatter.format(Math.round(diffInMonths / 12), 'year');
  }

  private formatAbsoluteDate(timestamp: number): string {
    return new Intl.DateTimeFormat('en', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(timestamp);
  }

  private colorFromSeed(seed: string): string {
    let hash = 0;
    for (let index = 0; index < seed.length; index += 1) {
      hash = seed.charCodeAt(index) + ((hash << 5) - hash);
    }

    const palette = ['#7566ff', '#59b6d9', '#6ec58d', '#f29d64', '#ef6f91', '#5f93ff'];
    return palette[Math.abs(hash) % palette.length];
  }

  private readNonEmptyString(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
  }
}
