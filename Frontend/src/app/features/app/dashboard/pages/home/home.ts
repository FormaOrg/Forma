import { Component, OnInit, ViewEncapsulation, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, of, timeout } from 'rxjs';
import { BillingOverview, DashboardProjectItem, DashboardTemplateItem } from '../../../../../core/models/dashboard.model';
import { User } from '../../../../../core/models/user.model';
import { DashboardDataService } from '../../../../../core/services/dashboard-data.service';
import { UserService } from '../../../../../core/services/user.service';
import { PRICING_PLANS } from '../../../../pricing/pricing-plans';
import { I18nService } from '../../../../landing-page/i18n/i18n.service';
import { TranslatePipe } from '../../../../landing-page/i18n/translate.pipe';
import { GreetingSection } from './components/greeting-section/greeting-section';
import { DataCard } from "./components/data-card/data-card";
import { RecentProjects } from "./components/recent-projects/recent-projects";
import { RecentActivity } from "./components/recent-activity/recent-activity";
import { AccountSnapshot } from './components/account-snapshot/account-snapshot';
import { SetupProgress } from './components/setup-progress/setup-progress';
import { RecentTemplates } from './components/recent-templates/recent-templates';
import { HomeActivityItem, HomeRecentProject, HomeRecentTemplateItem, HomeSetupStep } from './home.model';

@Component({
  selector: 'app-home',
  imports: [GreetingSection, DataCard, RecentProjects, RecentActivity, AccountSnapshot, SetupProgress, RecentTemplates, RouterLink, TranslatePipe],
  templateUrl: './home.html',
  styleUrl: './home.css',
  encapsulation: ViewEncapsulation.None,
})
export class Home implements OnInit {
  private readonly userService = inject(UserService);
  private readonly dashboardDataService = inject(DashboardDataService);
  private readonly i18n = inject(I18nService);

  isLoadingHome = true;
  userName = this.i18n.t('dashboard.home.common.there');
  sitesCreatedValue = '0';
  sitesCreatedDescription = this.i18n.t('dashboard.home.stats.sitesCreated.empty');
  publishedSitesValue = '0';
  publishedSitesDescription = this.i18n.t('dashboard.home.stats.published.empty');
  draftSitesValue = '0';
  draftSitesDescription = this.i18n.t('dashboard.home.stats.drafts.empty');
  lastActivityValue = this.i18n.t('dashboard.home.activity.noneTitle');
  lastActivityDescription = this.i18n.t('dashboard.home.activity.noneDescription');

  recentProjects: HomeRecentProject[] = [];
  recentTemplates: HomeRecentTemplateItem[] = [];
  recentActivities: HomeActivityItem[] = [];
  setupSteps: HomeSetupStep[] = [];
  setupPercent = 0;

  planLabel = this.i18n.t('dashboard.home.billing.free');
  renewsLabel = this.i18n.t('dashboard.home.billing.noPlan');
  accountBadges: string[] = [];

  globeIcon = `
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C17.523 2 22 6.477 22 12C22 17.523 17.523 22 12 22C6.477 22 2 17.523 2 12C2 6.477 6.477 2 12 2Z" stroke="currentColor" stroke-width="1.8"/>
    <path d="M2 12H22" stroke="currentColor" stroke-width="1.8"/>
    <path d="M12 2C14.5 4.7 16 8.2 16 12C16 15.8 14.5 19.3 12 22C9.5 19.3 8 15.8 8 12C8 8.2 9.5 4.7 12 2Z" stroke="currentColor" stroke-width="1.8"/>
  </svg>
  `;

  checkIcon = `
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.8"/>
    <path d="M8 12L10.8 14.8L16 9.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
  `;

  draftIcon = `
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7 3H14L19 8V21H7V3Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M14 3V8H19" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M10 12H16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M10 16H16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
  </svg>
  `;

  clockIcon = `
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.8"/>
    <path d="M12 7V12L15 15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
  `;

  ngOnInit(): void {
    forkJoin({
      user: this.userService.getMe().pipe(
        timeout(2500),
        catchError(() => of(null))
      ),
      projects: this.dashboardDataService.getProjectsOverview({ useCache: false }).pipe(
        timeout(2500),
        catchError(() => of([]))
      ),
      templates: this.dashboardDataService.getTemplatesOverview({ useCache: false }).pipe(
        timeout(2500),
        catchError(() => of([]))
      ),
      billing: this.dashboardDataService.getBillingOverview({ useCache: false }).pipe(
        timeout(2500),
        catchError(() => of(null))
      ),
    }).subscribe(({ user, projects, templates, billing }) => {
      this.userName = this.toDisplayName(user);
      this.recentProjects = this.toRecentProjects(projects);
      this.recentTemplates = this.toRecentTemplates(templates);
      this.recentActivities = this.toRecentActivities(projects);
      this.setupSteps = this.toSetupSteps(user, projects);
      this.setupPercent = this.toSetupPercent(this.setupSteps);

      this.applyStats(projects, this.recentActivities);
      this.applyBillingSnapshot(billing);
      this.isLoadingHome = false;
    });
  }

  private applyStats(projects: DashboardProjectItem[], activities: HomeActivityItem[]): void {
    const publishedCount = projects.filter((project) => project.status === 'published').length;
    const draftCount = projects.filter((project) => project.status === 'draft').length;
    const createdThisMonth = projects.filter((project) => this.isInCurrentMonth(project.createdAt)).length;

    this.sitesCreatedValue = String(projects.length);
    this.sitesCreatedDescription =
      createdThisMonth > 0
        ? `+${createdThisMonth} ${this.i18n.t('dashboard.home.stats.sitesCreated.thisMonth')}`
        : projects.length > 0
          ? this.i18n.t('dashboard.home.stats.sitesCreated.noNewThisMonth')
          : this.i18n.t('dashboard.home.stats.sitesCreated.empty');

    this.publishedSitesValue = String(publishedCount);
    this.publishedSitesDescription =
      projects.length > 0
        ? `${Math.round((publishedCount / projects.length) * 100)}% ${this.i18n.t('dashboard.home.stats.published.ofTotal')}`
        : this.i18n.t('dashboard.home.stats.published.empty');

    this.draftSitesValue = String(draftCount);
    this.draftSitesDescription =
      draftCount > 0
        ? draftCount === 1
          ? this.i18n.t('dashboard.home.stats.drafts.oneReady')
          : `${draftCount} ${this.i18n.t('dashboard.home.stats.drafts.manyReady')}`
        : this.i18n.t('dashboard.home.stats.drafts.empty');

    if (activities.length > 0) {
      this.lastActivityValue = activities[0].time;
      this.lastActivityDescription = activities[0].title;
      return;
    }

    this.lastActivityValue = this.i18n.t('dashboard.home.activity.noneTitle');
    this.lastActivityDescription = this.i18n.t('dashboard.home.activity.noneDescription');
  }

  private applyBillingSnapshot(billing: BillingOverview | null): void {
    const planName = billing?.subscription.planName?.trim();
    const status = billing?.subscription.status ?? 'inactive';

    if (!planName || status === 'inactive' || status === 'canceled') {
      this.planLabel = this.i18n.t('dashboard.home.billing.free');
      this.renewsLabel = this.i18n.t('dashboard.home.billing.noPlan');
      this.accountBadges = [];
      return;
    }

    this.planLabel = planName;
    this.renewsLabel = billing?.subscription.renewalDateLabel
      ? `${this.i18n.t('dashboard.home.billing.renews')} ${billing.subscription.renewalDateLabel}`
      : billing?.subscription.nextChargeLabel
        ? `${this.i18n.t('dashboard.home.billing.nextCharge')} ${billing.subscription.nextChargeLabel}`
        : this.i18n.t('dashboard.home.billing.planActive');

    const plan = PRICING_PLANS.find((entry) => entry.name.toLowerCase() === planName.toLowerCase());
    this.accountBadges = plan?.features.slice(0, 2) ?? [];
  }

  private toDisplayName(user: User | null): string {
    if (!user) {
      return this.i18n.t('dashboard.home.common.there');
    }

    const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
    return fullName || user.username?.trim() || user.email.split('@')[0] || this.i18n.t('dashboard.home.common.there');
  }

  private toRecentProjects(projects: DashboardProjectItem[]): HomeRecentProject[] {
    return [...projects]
      .filter((project) => project.status !== 'archived')
      .sort((left, right) => right.lastEditedAt - left.lastEditedAt)
      .slice(0, 5)
      .map((project) => ({
        name: project.name,
        domain: project.domain || project.metadata || project.typeLabel,
        updatedAt: project.lastEditedLabel,
        status: project.status === 'published' ? 'published' : 'draft',
        route: project.route || '/app/projects',
      }));
  }

  private toRecentTemplates(templates: DashboardTemplateItem[]): HomeRecentTemplateItem[] {
    return [...templates]
      .sort((left, right) => right.updatedAt - left.updatedAt)
      .slice(0, 3)
      .map((template) => ({
        name: template.name,
        hint: template.description || template.categoryLabel,
        image: template.previewImageUrl,
        route: template.previewRoute || '/app/templates',
      }));
  }

  private toRecentActivities(projects: DashboardProjectItem[]): HomeActivityItem[] {
    return projects
      .flatMap((project) => {
        const activities: Array<{ title: string; type: HomeActivityItem['type']; timestamp: number }> = [
          {
            title: `${this.i18n.t('dashboard.home.activity.created')} ${project.name}`,
            type: 'created',
            timestamp: project.createdAt,
          },
        ];

        if (project.status === 'published') {
          activities.push({
            title: `${this.i18n.t('dashboard.home.activity.published')} ${project.name}`,
            type: 'published',
            timestamp: project.lastEditedAt,
          });
        } else if (project.lastEditedAt - project.createdAt > 60000) {
          activities.push({
            title: `${this.i18n.t('dashboard.home.activity.edited')} ${project.name}`,
            type: 'edited',
            timestamp: project.lastEditedAt,
          });
        }

        return activities;
      })
      .sort((left, right) => right.timestamp - left.timestamp)
      .slice(0, 6)
      .map((activity) => ({
        title: activity.title,
        type: activity.type,
        time: this.formatRelativeTime(activity.timestamp),
      }));
  }

  private toSetupSteps(user: User | null, projects: DashboardProjectItem[]): HomeSetupStep[] {
    const profileDone = Boolean(
      user && (
        user.phone?.trim() ||
        user.country?.trim() ||
        user.website?.trim() ||
        user.avatarUrl?.trim()
      )
    );
    const hasProjects = projects.length > 0;
    const hasPublishedProject = projects.some((project) => project.status === 'published');

    return [
      { id: 'profile', label: this.i18n.t('dashboard.home.setup.profile'), done: profileDone },
      { id: 'google', label: this.i18n.t('dashboard.home.setup.socialLogin'), done: Boolean(user?.googleConnected) },
      { id: 'first-project', label: this.i18n.t('dashboard.home.setup.firstProject'), done: hasProjects },
      { id: 'publish', label: this.i18n.t('dashboard.home.setup.publishSite'), done: hasPublishedProject },
    ];
  }

  private toSetupPercent(steps: HomeSetupStep[]): number {
    if (!steps.length) {
      return 0;
    }

    const doneCount = steps.filter((step) => step.done).length;
    return Math.round((doneCount / steps.length) * 100);
  }

  private isInCurrentMonth(timestamp: number): boolean {
    const value = new Date(timestamp);
    const now = new Date();

    return value.getFullYear() === now.getFullYear() && value.getMonth() === now.getMonth();
  }

  private formatRelativeTime(timestamp: number): string {
    const diffInMinutes = Math.round((timestamp - Date.now()) / 60000);
    const absoluteMinutes = Math.abs(diffInMinutes);
    const formatter = new Intl.RelativeTimeFormat(this.i18n.lang(), { numeric: 'auto' });

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
}
