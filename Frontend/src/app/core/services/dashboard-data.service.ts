import { Injectable } from '@angular/core';
import { forkJoin, Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { DASHBOARD_TEMPLATE_FALLBACKS, DashboardTemplateFallbackSeed } from '../data/dashboard-templates-fallback.data';
import {
  BillingInvoiceItem,
  BillingOverview,
  BillingPaymentMethodSummary,
  BillingSubscriptionSummary,
  BillingUsageMetric,
  DashboardProjectItem,
  DashboardProjectStatus,
  DashboardTemplateItem,
} from '../models/dashboard.model';
import { CreationMethod, Deployment, Media, Project, ProjectType, TemplateRecord } from '../models/project.model';
import { User } from '../models/user.model';
import { ProjectService } from './project.service';
import { UserService } from './user.service';

@Injectable({ providedIn: 'root' })
export class DashboardDataService {
  constructor(
    private readonly projectService: ProjectService,
    private readonly userService: UserService
  ) {}

  getProjectsOverview(): Observable<DashboardProjectItem[]> {
    return this.projectService.getMyProjects().pipe(
      switchMap((projects) => {
        if (!projects.length) {
          return of([]);
        }

        return forkJoin(
          projects.map((project) =>
            forkJoin({
              deployment: this.projectService.getDeployment(project.id).pipe(catchError(() => of(null))),
              media: this.projectService.getProjectMedia(project.id).pipe(catchError(() => of([] as Media[]))),
            }).pipe(map((extras) => this.toDashboardProject(project, extras.deployment, extras.media)))
          )
        );
      })
    );
  }

  getBillingOverview(): Observable<BillingOverview> {
    return forkJoin({
      user: this.userService.getMe(),
      projects: this.getProjectsOverview().pipe(catchError(() => of([]))),
    }).pipe(map(({ user, projects }) => this.toBillingOverview(user, projects)));
  }

  getTemplatesOverview(): Observable<DashboardTemplateItem[]> {
    return this.projectService.getTemplates().pipe(
      map((records) => this.toDashboardTemplates(records)),
      catchError((error) => {
        const status = this.readErrorStatus(error);

        if (status === 404 || status === 405 || status === 501) {
          return of(this.toFallbackTemplates());
        }

        return throwError(() => error);
      })
    );
  }

  private toDashboardProject(project: Project, deployment: Deployment | null, media: Media[]): DashboardProjectItem {
    const createdAt = this.toTimestamp(project.createdAt);
    const updatedAt = this.toTimestamp(deployment?.deployedAt ?? project.createdAt);
    const status = this.toProjectStatus(project.status);
    const domain = this.resolveDomain(deployment);
    const liveUrl = this.resolveLiveUrl(deployment);
    const image = media.find((item) => item.type === 'IMAGE');

    return {
      id: String(project.id),
      backendId: project.id,
      name: project.name?.trim() || 'Untitled project',
      description: project.description?.trim() || `${this.toProjectTypeLabel(project.type)} project`,
      status,
      statusLabel: this.toProjectStatusLabel(status),
      domain,
      liveUrl,
      previewUrl: liveUrl,
      thumbnailUrl: image?.fileUrl,
      accent: this.colorFromSeed(`${project.id}-${project.type}`),
      route: '/app/projects',
      previewRoute: liveUrl,
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

  private toBillingOverview(user: User, projects: DashboardProjectItem[]): BillingOverview {
    const activeProjectsCount = projects.length;
    const publishedProjects = projects.filter((project) => project.status === 'published').length;
    const draftProjects = projects.filter((project) => project.status === 'draft').length;
    const subscription = this.toSubscriptionSummary(user);
    const paymentMethod = this.toPaymentMethodSummary(user, subscription);
    const invoices: BillingInvoiceItem[] = [];
    const usage: BillingUsageMetric[] = [
      {
        label: 'Projects',
        used: activeProjectsCount,
        limit: subscription.status === 'active' ? null : undefined,
        unit: 'sites',
        note:
          subscription.status === 'active'
            ? 'Project count synced from your live account.'
            : 'Create a paid plan to unlock tracked subscription limits.',
      },
      {
        label: 'Published sites',
        used: publishedProjects,
        unit: 'live sites',
        note: publishedProjects
          ? 'Live deployments connected from your current projects.'
          : 'Publish a project to see live sites appear here.',
      },
      {
        label: 'Drafts',
        used: draftProjects,
        unit: 'drafts',
        note: draftProjects
          ? 'Draft projects are ready for more edits before publishing.'
          : 'No draft projects are waiting in your workspace.',
      },
    ];

    return {
      subscription,
      usage,
      paymentMethod,
      invoices,
      activeProjectsCount,
      paidInvoicesCount: invoices.filter((invoice) => invoice.statusLabel === 'Paid').length,
      currentSpendLabel: subscription.nextChargeLabel ?? 'No active plan',
    };
  }

  private toDashboardTemplates(records: TemplateRecord[]): DashboardTemplateItem[] {
    if (!records.length) {
      return this.toFallbackTemplates();
    }

    const mapped = records.map((record, index) =>
      this.toDashboardTemplate(record, DASHBOARD_TEMPLATE_FALLBACKS[index % DASHBOARD_TEMPLATE_FALLBACKS.length], index)
    );

    const supplemental = DASHBOARD_TEMPLATE_FALLBACKS
      .slice(0, Math.max(0, DASHBOARD_TEMPLATE_FALLBACKS.length - mapped.length))
      .map((seed, index) => this.toFallbackTemplate(seed, mapped.length + index));

    return [...mapped, ...supplemental].sort((left, right) => {
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
    seed: DashboardTemplateFallbackSeed,
    index: number
  ): DashboardTemplateItem {
    const name = this.readNonEmptyString(record.name) ?? this.readNonEmptyString(record.title) ?? seed.name;
    const description =
      this.readNonEmptyString(record.description) ?? this.readNonEmptyString(record.summary) ?? seed.description;
    const category = this.readNonEmptyString(record.category) ?? this.readNonEmptyString(record.label) ?? seed.category;
    const projectType = this.toTemplateProjectType(record.projectType ?? record.type, seed.projectType);
    const creationMethod = this.toTemplateCreationMethod(record.creationMethod, seed.creationMethod);
    const previewImageUrl = this.readNonEmptyString(record.previewImageUrl) ?? seed.previewImageUrl;
    const previewRoute =
      this.readNonEmptyString(record.previewRoute) ?? this.readNonEmptyString(record.route) ?? seed.previewRoute;
    const previewUrl = this.readNonEmptyString(record.previewUrl);
    const updatedAt = this.toTimestamp(record.updatedAt ?? record.createdAt);
    const usesCount =
      typeof record.usesCount === 'number' && Number.isFinite(record.usesCount) ? record.usesCount : seed.usesCount;
    const isFeatured = typeof record.featured === 'boolean' ? record.featured : Boolean(seed.isFeatured);
    const isOwned = Boolean(record.isOwned);
    const tags = Array.isArray(record.tags)
      ? record.tags.filter((tag): tag is string => typeof tag === 'string' && tag.trim().length > 0)
      : [category];
    const hasCompleteBackendData =
      Boolean(this.readNonEmptyString(record.name) || this.readNonEmptyString(record.title)) &&
      Boolean(this.readNonEmptyString(record.description) || this.readNonEmptyString(record.summary)) &&
      Boolean(this.readNonEmptyString(record.previewImageUrl));

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
      accent: seed.accent,
      badgeLabel: isOwned ? 'My template' : isFeatured ? 'Featured' : undefined,
      source: hasCompleteBackendData ? 'backend' : 'hybrid',
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

  private toFallbackTemplates(): DashboardTemplateItem[] {
    return DASHBOARD_TEMPLATE_FALLBACKS.map((seed, index) => this.toFallbackTemplate(seed, index));
  }

  private toFallbackTemplate(seed: DashboardTemplateFallbackSeed, index: number): DashboardTemplateItem {
    const updatedAt = Date.now() - index * 86400000;

    return {
      id: seed.id,
      name: seed.name,
      description: seed.description,
      category: seed.category,
      categoryLabel: seed.category,
      projectType: seed.projectType,
      creationMethod: seed.creationMethod,
      previewImageUrl: seed.previewImageUrl,
      previewRoute: seed.previewRoute,
      accent: seed.accent,
      badgeLabel: seed.isFeatured ? 'Featured' : undefined,
      source: 'fallback',
      isFeatured: Boolean(seed.isFeatured),
      isOwned: false,
      tags: [seed.category],
      usesCount: seed.usesCount,
      usesLabel: `${seed.usesCount} uses`,
      updatedLabel: this.formatRelativeDate(updatedAt),
      updatedAt,
      sortIndex: index,
    };
  }

  private toSubscriptionSummary(user: User): BillingSubscriptionSummary {
    if (user.role === 'PREMIUM') {
      return {
        planName: 'Pro',
        planDescription: 'Premium access inferred from your current account role.',
        status: 'active',
        billingMode: 'yearly',
        billingCycleLabel: 'Billing details unavailable',
        promoNotice:
          'Your account has premium access, but this workspace does not yet expose renewal or invoice records from the backend.',
      };
    }

    return {
      status: 'inactive',
      billingMode: 'yearly',
    };
  }

  private toPaymentMethodSummary(
    user: User,
    subscription: BillingSubscriptionSummary
  ): BillingPaymentMethodSummary | null {
    if (subscription.status !== 'active') {
      return null;
    }

    return {
      contactEmail: user.email,
      summary: 'No saved payment method was returned by the backend for this account yet.',
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
      case 'HYBRID':
        return 'HYBRID';
      case 'VISUAL_DESIGNER':
        return 'VISUAL_DESIGNER';
      default:
        return fallback;
    }
  }

  private toTimestamp(value: string | null | undefined): number {
    const parsed = value ? Date.parse(value) : Number.NaN;
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

  private resolveDomain(deployment: Deployment | null): string | undefined {
    if (!deployment) {
      return undefined;
    }

    if (deployment.customDomain?.trim()) {
      return deployment.customDomain.trim();
    }

    try {
      return new URL(deployment.serverUrl).host;
    } catch {
      return deployment.subdomain?.trim() || undefined;
    }
  }

  private resolveLiveUrl(deployment: Deployment | null): string | undefined {
    if (!deployment?.serverUrl?.trim()) {
      return undefined;
    }

    return deployment.serverUrl.trim();
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

  private readErrorStatus(error: unknown): number | undefined {
    if (typeof error === 'object' && error && 'status' in error) {
      const value = (error as { status?: unknown }).status;
      return typeof value === 'number' ? value : undefined;
    }

    return undefined;
  }
}
