import { Injectable } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import {
  BillingInvoiceItem,
  BillingOverview,
  BillingPaymentMethodSummary,
  BillingSubscriptionSummary,
  BillingUsageMetric,
  DashboardProjectItem,
  DashboardProjectStatus,
} from '../models/dashboard.model';
import { Deployment, Media, Project } from '../models/project.model';
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
}
