import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { finalize, map } from 'rxjs';
import { ProjectHomePage } from '../../../../../../core/models/project-home.model';
import { ProjectHomeService } from '../../../../../../core/services/project-home.service';
import {
  getProjectWorkspaceConfig,
  normalizeProjectWorkspaceType,
} from '../../../../../../shared/app/project-workspace/project-workspace.config';
import { I18nService } from '../../../../../landing-page/i18n/i18n.service';
import { TranslatePipe } from '../../../../../landing-page/i18n/translate.pipe';

type ProjectHomeMetricTone = 'violet' | 'blue' | 'mint' | 'amber';
type ProjectHomeMetricIcon =
  | 'catalog'
  | 'customer'
  | 'order'
  | 'revenue'
  | 'pages'
  | 'audience'
  | 'launch';

interface ProjectHomeMetricCard {
  label: string;
  value: string;
  helper: string;
  tone: ProjectHomeMetricTone;
  icon: ProjectHomeMetricIcon;
}

@Component({
  selector: 'app-project-home-route',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe],
  templateUrl: './project-home-route.html',
})
export class ProjectHomeRoute {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly projectHomeService = inject(ProjectHomeService);
  private readonly i18n = inject(I18nService);

  readonly projectId = toSignal(
    this.route.parent!.paramMap.pipe(map((params) => Number(params.get('projectId') ?? '0'))),
    { initialValue: Number(this.route.parent?.snapshot.paramMap.get('projectId') ?? '0') }
  );

  readonly page = signal<ProjectHomePage | null>(null);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');
  readonly workspaceConfig = computed(() => getProjectWorkspaceConfig(this.page()?.projectType));
  readonly metrics = computed(() => this.page()?.metrics ?? []);
  readonly activities = computed(() => (this.page()?.recentActivities ?? []).slice(0, 5));
  readonly actions = computed(() => this.page()?.suggestedActions ?? []);
  readonly isPortfolioWorkspace = computed(
    () => normalizeProjectWorkspaceType(this.page()?.projectType) === 'PORTFOLIO'
  );
  readonly heroEyebrow = computed(() =>
    this.isPortfolioWorkspace() ? this.i18n.t('project.home.hero.portfolioEyebrow') : this.i18n.t('project.home.hero.projectEyebrow')
  );
  readonly heroTitle = computed(() => {
    const page = this.page();
    if (!page) {
      return '';
    }

    if (this.isPortfolioWorkspace()) {
      return `${page.projectName} ${this.i18n.t('project.home.hero.portfolioTitleSuffix')}`;
    }

    return `${this.i18n.t('project.home.hero.welcomeBack')}, ${page.ownerName}.`;
  });
  readonly heroSubtitle = computed(() => {
    const page = this.page();
    if (!page) {
      return '';
    }

    if (this.isPortfolioWorkspace()) {
      return this.i18n.t('project.home.hero.portfolioSubtitle');
    }

    return this.workspaceConfig().homeSubtitle;
  });
  readonly heroAction = computed(() => {
    const page = this.page();
    if (!page) {
      return null;
    }

    if (this.isPortfolioWorkspace()) {
      return {
        label: this.i18n.t('project.home.actions.reviewPages'),
        route: ['/app/projects', page.projectId, 'pages'],
      };
    }

    const workspaceConfig = this.workspaceConfig();
    return {
      label: workspaceConfig.heroActionLabel,
      route: ['/app/projects', page.projectId, workspaceConfig.heroActionPath],
    };
  });
  readonly activityHeading = computed(() =>
    this.isPortfolioWorkspace() ? this.i18n.t('project.home.activity.portfolioPulse') : this.i18n.t('project.home.activity.recent')
  );
  readonly activityDescription = computed(() =>
    this.isPortfolioWorkspace()
      ? this.i18n.t('project.home.activity.portfolioDescription')
      : this.workspaceConfig().activityDescription
  );
  readonly suggestedDescription = computed(() =>
    this.isPortfolioWorkspace()
      ? this.i18n.t('project.home.suggested.portfolioDescription')
      : this.i18n.t('project.home.suggested.defaultDescription')
  );
  readonly displayMetricCards = computed(() => this.buildDefaultMetricCards(this.metrics()));
  readonly displayActivities = computed(() => this.activities());
  readonly displayActions = computed(() => this.actions());
  readonly statusPills = computed(() => {
    const page = this.page();
    if (!page) {
      return [];
    }

    return [
      { label: page.projectStatus.replaceAll('_', ' '), accent: page.published },
      { label: page.projectType.replaceAll('_', ' '), accent: false },
      { label: page.creationMethod.replaceAll('_', ' '), accent: false },
    ];
  });

  constructor() {
    this.loadHomePage();
  }

  loadHomePage(): void {
    const projectId = this.projectId();
    if (!projectId) {
      this.errorMessage.set(this.i18n.t('project.home.errors.notFound'));
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.projectHomeService
      .getHomePage(projectId)
      .pipe(finalize(() => this.isLoading.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (page) => this.page.set(page),
        error: () => {
          this.page.set(null);
          this.errorMessage.set(this.i18n.t('project.home.errors.load'));
        },
      });
  }

  formatOccurredAt(value: string): string {
    const parsed = Date.parse(value);
    if (!Number.isFinite(parsed)) {
      return value;
    }

    const minutes = Math.round((parsed - Date.now()) / 60000);
    const absoluteMinutes = Math.abs(minutes);
    const formatter = new Intl.RelativeTimeFormat(this.i18n.lang(), { numeric: 'auto' });

    if (absoluteMinutes < 60) {
      return formatter.format(minutes, 'minute');
    }

    const hours = Math.round(minutes / 60);
    if (Math.abs(hours) < 24) {
      return formatter.format(hours, 'hour');
    }

    const days = Math.round(hours / 24);
    return formatter.format(days, 'day');
  }

  activityTone(activity: { title: string; description: string; route: string }): 'page' | 'audience' | 'launch' | 'catalog' | 'customer' | 'order' | 'project' {
    const normalized = `${activity.title} ${activity.description} ${activity.route}`.toLowerCase();

    if (
      normalized.includes('/pages') ||
      normalized.includes('page map') ||
      normalized.includes('case stud') ||
      normalized.includes('homepage')
    ) {
      return 'page';
    }

    if (
      normalized.includes('/audience') ||
      normalized.includes('inquir') ||
      normalized.includes('contact') ||
      normalized.includes('lead')
    ) {
      return 'audience';
    }

    if (
      normalized.includes('/analytics') ||
      normalized.includes('publish') ||
      normalized.includes('launch')
    ) {
      return 'launch';
    }

    if (normalized.includes('customer')) {
      return 'customer';
    }

    if (normalized.includes('order') || normalized.includes('sale')) {
      return 'order';
    }

    if (normalized.includes('catalog') || normalized.includes('product')) {
      return 'catalog';
    }

    return 'project';
  }

  suggestedActionTone(action: { title: string; description: string; route: string }): 'page' | 'audience' | 'setup' | 'catalog' | 'customer' | 'launch' {
    const normalized = `${action.title} ${action.description} ${action.route}`.toLowerCase();

    if (
      normalized.includes('/pages') ||
      normalized.includes('page') ||
      normalized.includes('case stud')
    ) {
      return 'page';
    }

    if (
      normalized.includes('/audience') ||
      normalized.includes('inquir') ||
      normalized.includes('contact')
    ) {
      return 'audience';
    }

    if (normalized.includes('catalog') || normalized.includes('product')) {
      return 'catalog';
    }

    if (normalized.includes('customer')) {
      return 'customer';
    }

    if (normalized.includes('publish') || normalized.includes('launch') || normalized.includes('storefront')) {
      return 'launch';
    }

    return 'setup';
  }

  private buildDefaultMetricCards(metrics: ProjectHomePage['metrics']): ProjectHomeMetricCard[] {
    const tones: ProjectHomeMetricTone[] = ['violet', 'blue', 'mint', 'amber'];
    const icons: ProjectHomeMetricIcon[] = this.isPortfolioWorkspace()
      ? ['pages', 'audience', 'launch', 'launch']
      : ['catalog', 'customer', 'order', 'revenue'];

    return metrics.map((metric, index) => ({
      ...metric,
      tone: tones[index] ?? 'violet',
      icon: icons[index] ?? 'catalog',
    }));
  }

  private projectRoute(path: string): string {
    return `/app/projects/${this.projectId()}/${path}`;
  }
}
