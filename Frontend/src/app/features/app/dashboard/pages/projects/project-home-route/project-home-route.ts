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
  imports: [CommonModule, RouterLink],
  templateUrl: './project-home-route.html',
  styleUrl: './project-home-route.css',
})
export class ProjectHomeRoute {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly projectHomeService = inject(ProjectHomeService);

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
    this.isPortfolioWorkspace() ? 'Portfolio workspace' : 'Project workspace'
  );
  readonly heroTitle = computed(() => {
    const page = this.page();
    if (!page) {
      return '';
    }

    if (this.isPortfolioWorkspace()) {
      return `${page.projectName} is taking shape as a polished portfolio.`;
    }

    return `Welcome back, ${page.ownerName}.`;
  });
  readonly heroSubtitle = computed(() => {
    const page = this.page();
    if (!page) {
      return '';
    }

    if (this.isPortfolioWorkspace()) {
      return 'Keep your page structure, inquiry flow, and launch state aligned as you shape a stronger first impression.';
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
        label: 'Review pages',
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
    this.isPortfolioWorkspace() ? 'Portfolio pulse' : 'Recent activity'
  );
  readonly activityDescription = computed(() =>
    this.isPortfolioWorkspace()
      ? 'Recent motion across page structure, inquiry flow, and launch readiness.'
      : this.workspaceConfig().activityDescription
  );
  readonly suggestedDescription = computed(() =>
    this.isPortfolioWorkspace()
      ? 'Recommended focus areas based on your current pages, inquiry flow, and launch state.'
      : 'Actions derived from the current persisted state of this project.'
  );
  readonly displayMetricCards = computed(() =>
    this.isPortfolioWorkspace()
      ? this.buildPortfolioMetricCards()
      : this.buildDefaultMetricCards(this.metrics())
  );
  readonly displayActivities = computed(() =>
    this.isPortfolioWorkspace() ? this.buildPortfolioActivities() : this.activities()
  );
  readonly displayActions = computed(() =>
    this.isPortfolioWorkspace() ? this.buildPortfolioActions() : this.actions()
  );
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
      this.errorMessage.set('Project not found.');
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
          this.errorMessage.set('Unable to load this project workspace right now.');
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
    const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

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
    const icons: ProjectHomeMetricIcon[] = ['catalog', 'customer', 'order', 'revenue'];

    return metrics.map((metric, index) => ({
      ...metric,
      tone: tones[index] ?? 'violet',
      icon: icons[index] ?? 'catalog',
    }));
  }

  private buildPortfolioMetricCards(): ProjectHomeMetricCard[] {
    return [
      {
        label: 'Pages',
        value: '4',
        helper: '2 published, 1 in progress, 1 draft',
        tone: 'violet',
        icon: 'pages',
      },
      {
        label: 'Inquiries',
        value: '3',
        helper: '1 new lead, 2 active conversations',
        tone: 'blue',
        icon: 'audience',
      },
      {
        label: 'Published',
        value: '2',
        helper: 'Home and About are ready for visitors',
        tone: 'mint',
        icon: 'launch',
      },
      {
        label: 'Launch state',
        value: 'Draft',
        helper: 'Keep refining Projects and Contact before going live',
        tone: 'amber',
        icon: 'launch',
      },
    ];
  }

  private buildPortfolioActivities(): ProjectHomePage['recentActivities'] {
    const page = this.page();
    if (!page) {
      return [];
    }

    return [
      {
        title: 'Page map reviewed',
        description: `${page.projectName} now covers home, about, projects, and contact in the current structure.`,
        occurredAt: this.minutesAgo(45),
        route: this.projectRoute('pages'),
      },
      {
        title: 'Inquiry flow checked',
        description: 'Your contact experience is ready to capture new leads and keep active conversations visible.',
        occurredAt: this.minutesAgo(120),
        route: this.projectRoute('audience'),
      },
      {
        title: 'Homepage polish in progress',
        description: 'Your core pages are aligned around a clearer first impression and a stronger creative narrative.',
        occurredAt: this.minutesAgo(210),
        route: this.projectRoute('pages'),
      },
      {
        title: page.published ? 'Portfolio published' : 'Draft polish in progress',
        description: page.published
          ? 'The live portfolio is ready to share while you keep refining pages and lead capture.'
          : 'The portfolio stays private while you finish the final page and inquiry-flow polish.',
        occurredAt: this.minutesAgo(360),
        route: page.published ? this.projectRoute('analytics') : this.projectRoute('pages'),
      },
    ];
  }

  private buildPortfolioActions(): ProjectHomePage['suggestedActions'] {
    const page = this.page();
    if (!page) {
      return [];
    }

    return [
      {
        title: 'Refine homepage and case studies',
        description: 'Strengthen the first impression, featured work, and supporting page structure before you publish.',
        route: this.projectRoute('pages'),
        actionLabel: 'Review pages',
      },
      {
        title: 'Tighten the contact flow',
        description: 'Make the contact page and inquiry path feel clear before the portfolio goes live.',
        route: this.projectRoute('audience'),
        actionLabel: 'View inquiries',
      },
      {
        title: page.published ? 'Check portfolio analytics' : 'Tighten the contact flow',
        description: page.published
          ? 'Watch how visitors engage with the portfolio once traffic starts landing.'
          : 'Review launch readiness and make sure your page structure feels complete before publishing.',
        route: page.published ? this.projectRoute('analytics') : this.projectRoute('pages'),
        actionLabel: page.published ? 'Open analytics' : 'Review pages',
      },
    ];
  }

  private projectRoute(path: string): string {
    return `/app/projects/${this.projectId()}/${path}`;
  }

  private minutesAgo(minutes: number): string {
    return new Date(Date.now() - minutes * 60_000).toISOString();
  }
}
