import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { DashboardProjectItem } from '../../../../../core/models/dashboard.model';
import { DashboardDataService } from '../../../../../core/services/dashboard-data.service';
import { ProjectService } from '../../../../../core/services/project.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { I18nService } from '../../../../landing-page/i18n/i18n.service';
import { TranslatePipe } from '../../../../landing-page/i18n/translate.pipe';
import { DataCard } from '../home/components/data-card/data-card';
import { ProjectCard, ProjectStatus } from './components/project-card/project-card';

type ProjectFilter = 'all' | ProjectStatus | 'archived';
type ProjectSort = 'last-edited' | 'name' | 'recently-created';
type ProjectView = 'cards' | 'rows';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DataCard, ProjectCard, TranslatePipe],
  templateUrl: './projects.live.html',
})
export class Projects implements OnInit {
  private readonly dashboardDataService = inject(DashboardDataService);
  private readonly projectService = inject(ProjectService);
  private readonly toastService = inject(ToastService);
  private readonly i18n = inject(I18nService);

  readonly globeIcon = `
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C17.523 2 22 6.477 22 12C22 17.523 17.523 22 12 22C6.477 22 2 17.523 2 12C2 6.477 6.477 2 12 2Z" stroke="currentColor" stroke-width="1.8"/>
    <path d="M2 12H22" stroke="currentColor" stroke-width="1.8"/>
    <path d="M12 2C14.5 4.7 16 8.2 16 12C16 15.8 14.5 19.3 12 22C9.5 19.3 8 15.8 8 12C8 8.2 9.5 4.7 12 2Z" stroke="currentColor" stroke-width="1.8"/>
  </svg>
  `;

  readonly checkIcon = `
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.8"/>
    <path d="M8 12L10.8 14.8L16 9.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
  `;

  readonly draftIcon = `
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7 3H14L19 8V21H7V3Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M14 3V8H19" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M10 12H16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M10 16H16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
  </svg>
  `;

  readonly projects = signal<DashboardProjectItem[]>([]);
  readonly searchTerm = signal('');
  readonly activeFilter = signal<ProjectFilter>('all');
  readonly activeSort = signal<ProjectSort>('last-edited');
  readonly activeView = signal<ProjectView>('cards');
  readonly filterDropdownOpen = signal(false);
  readonly sortDropdownOpen = signal(false);
  readonly activeProjectActionsId = signal<string | null>(null);
  readonly projectActionsPosition = signal({ x: 0, y: 0 });
  readonly projectActionInFlight = signal<{ projectId: string; action: 'duplicate' | 'publish' | 'archive' | 'restore' | 'delete' } | null>(null);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');

  readonly totalProjects = computed(() => this.projects().length);
  readonly publishedProjects = computed(() => this.projects().filter((project) => project.status === 'published').length);
  readonly draftProjects = computed(() => this.projects().filter((project) => project.status === 'draft').length);
  readonly archivedProjects = computed(() => this.projects().filter((project) => project.status === 'archived').length);
  readonly activeFilterLabel = computed(() => {
    switch (this.activeFilter()) {
      case 'published':
        return 'dashboard.projects.filters.published';
      case 'draft':
        return 'dashboard.projects.filters.draft';
      case 'archived':
        return 'dashboard.projects.filters.archived';
      default:
        return 'dashboard.projects.filters.all';
    }
  });
  readonly activeSortLabel = computed(() => {
    switch (this.activeSort()) {
      case 'name':
        return 'dashboard.projects.sort.name';
      case 'recently-created':
        return 'dashboard.projects.sort.recentlyCreated';
      default:
        return 'dashboard.projects.sort.lastEdited';
    }
  });

  readonly mostRecentProject = computed(() =>
    [...this.projects()].sort((left, right) => right.lastEditedAt - left.lastEditedAt)[0] ?? null
  );

  readonly filteredProjects = computed(() => {
    const query = this.searchTerm().trim().toLowerCase();
    const filter = this.activeFilter();
    const sort = this.activeSort();

    const filtered = this.projects().filter((project) => {
      const matchesQuery =
        query.length === 0 ||
        project.name.toLowerCase().includes(query) ||
        project.description.toLowerCase().includes(query) ||
        project.typeLabel.toLowerCase().includes(query) ||
        project.creationMethodLabel.toLowerCase().includes(query);
      const matchesFilter = filter === 'all' || project.status === filter;

      return matchesQuery && matchesFilter;
    });

    return filtered.sort((left, right) => {
      if (sort === 'name') {
        return left.name.localeCompare(right.name);
      }

      if (sort === 'recently-created') {
        return right.createdAt - left.createdAt;
      }

      return right.lastEditedAt - left.lastEditedAt;
    });
  });

  readonly featuredProject = computed(() => {
    const mostRecent = this.mostRecentProject();
    if (!mostRecent) {
      return null;
    }

    return this.filteredProjects().find((project) => project.id === mostRecent.id) ?? null;
  });

  readonly secondaryProjects = computed(() => {
    const featured = this.featuredProject();
    return this.filteredProjects().filter((project) => project.id !== featured?.id);
  });

  readonly activeProjectActionsProject = computed(() =>
    this.projects().find((project) => project.id === this.activeProjectActionsId()) ?? null
  );

  ngOnInit(): void {
    this.loadProjects();
  }

  loadProjects(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.dashboardDataService
      .getProjectsOverview()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (projects) => this.projects.set(projects),
        error: (error) => {
          this.errorMessage.set(this.toProjectsErrorMessage(error));
          this.projects.set([]);
        },
      });
  }

  private toProjectsErrorMessage(error: unknown): string {
    const status = this.readErrorStatus(error);

    if (status === 0) {
      return this.i18n.t('dashboard.projects.errors.connection');
    }

    return this.i18n.t('dashboard.projects.errors.load');
  }

  private readErrorStatus(error: unknown): number | undefined {
    if (typeof error === 'object' && error && 'status' in error) {
      const value = (error as { status?: unknown }).status;
      return typeof value === 'number' ? value : undefined;
    }

    return undefined;
  }

  updateSearchTerm(value: string): void {
    this.searchTerm.set(value);
  }

  updateFilter(filter: ProjectFilter): void {
    this.activeFilter.set(filter);
    this.filterDropdownOpen.set(false);
    this.closeOverlays();
  }

  updateSort(sort: ProjectSort): void {
    this.activeSort.set(sort);
    this.sortDropdownOpen.set(false);
  }

  updateView(view: ProjectView): void {
    this.activeView.set(view);
  }

  toggleSortDropdown(): void {
    this.sortDropdownOpen.update((value) => !value);
    this.filterDropdownOpen.set(false);
    this.closeProjectActions();
  }

  toggleFilterDropdown(): void {
    this.filterDropdownOpen.update((value) => !value);
    this.sortDropdownOpen.set(false);
    this.closeProjectActions();
  }

  closeDropdowns(): void {
    this.filterDropdownOpen.set(false);
    this.sortDropdownOpen.set(false);
  }

  closeProjectActions(): void {
    this.activeProjectActionsId.set(null);
  }

  closeOverlays(): void {
    this.closeDropdowns();
    this.closeProjectActions();
  }

  toggleProjectActions(project: DashboardProjectItem, event: MouseEvent): void {
    event.stopPropagation();

    if (this.activeProjectActionsId() === project.id) {
      this.closeProjectActions();
      return;
    }

    this.closeDropdowns();
    this.activeProjectActionsId.set(project.id);
    this.projectActionsPosition.set(this.computeProjectActionsPosition(event.currentTarget as HTMLElement | null, project.status === 'archived'));
  }

  isProjectActionsOpen(projectId: string): boolean {
    return this.activeProjectActionsId() === projectId;
  }

  isProjectActionBusy(projectId: string, action?: 'duplicate' | 'publish' | 'archive' | 'restore' | 'delete'): boolean {
    const pending = this.projectActionInFlight();
    if (!pending || pending.projectId !== projectId) {
      return false;
    }

    return action ? pending.action === action : true;
  }

  duplicateProject(project: DashboardProjectItem): void {
    if (this.isProjectActionBusy(project.id)) {
      return;
    }

    this.projectActionInFlight.set({ projectId: project.id, action: 'duplicate' });
    this.projectService.duplicateProject(project.backendId)
      .pipe(finalize(() => this.projectActionInFlight.set(null)))
      .subscribe({
        next: () => {
          this.toastService.success(this.i18n.t('dashboard.projects.menu.messages.duplicated'));
          this.afterProjectMutation();
        },
        error: () => this.toastService.error(this.i18n.t('dashboard.projects.menu.messages.duplicateError')),
      });
  }

  publishProject(project: DashboardProjectItem): void {
    if (this.isProjectActionBusy(project.id)) {
      return;
    }

    this.projectActionInFlight.set({ projectId: project.id, action: 'publish' });
    this.projectService.publishProject(project.backendId)
      .pipe(finalize(() => this.projectActionInFlight.set(null)))
      .subscribe({
        next: () => {
          this.toastService.success(this.i18n.t('dashboard.projects.menu.messages.published'));
          this.afterProjectMutation();
        },
        error: () => this.toastService.error(this.i18n.t('dashboard.projects.menu.messages.publishError')),
      });
  }

  archiveProject(project: DashboardProjectItem): void {
    if (this.isProjectActionBusy(project.id)) {
      return;
    }

    this.projectActionInFlight.set({ projectId: project.id, action: 'archive' });
    this.projectService.updateProject(project.backendId, {
      status: 'ARCHIVED',
      isPublished: false,
    })
      .pipe(finalize(() => this.projectActionInFlight.set(null)))
      .subscribe({
        next: () => {
          this.toastService.success(this.i18n.t('dashboard.projects.menu.messages.archived'));
          this.afterProjectMutation();
        },
        error: () => this.toastService.error(this.i18n.t('dashboard.projects.menu.messages.archiveError')),
      });
  }

  restoreProject(project: DashboardProjectItem): void {
    if (this.isProjectActionBusy(project.id)) {
      return;
    }

    this.projectActionInFlight.set({ projectId: project.id, action: 'restore' });
    this.projectService.updateProject(project.backendId, {
      status: 'DRAFT',
      isPublished: false,
    })
      .pipe(finalize(() => this.projectActionInFlight.set(null)))
      .subscribe({
        next: () => {
          this.toastService.success(this.i18n.t('dashboard.projects.menu.messages.restored'));
          this.afterProjectMutation();
        },
        error: () => this.toastService.error(this.i18n.t('dashboard.projects.menu.messages.restoreError')),
      });
  }

  deleteProject(project: DashboardProjectItem): void {
    if (this.isProjectActionBusy(project.id)) {
      return;
    }

    const confirmed = window.confirm(`${this.i18n.t('dashboard.projects.menu.confirmDelete')} ${project.name}?`);
    if (!confirmed) {
      return;
    }

    this.projectActionInFlight.set({ projectId: project.id, action: 'delete' });
    this.projectService.deleteProject(project.backendId)
      .pipe(finalize(() => this.projectActionInFlight.set(null)))
      .subscribe({
        next: () => {
          this.toastService.success(this.i18n.t('dashboard.projects.menu.messages.deleted'));
          this.afterProjectMutation();
        },
        error: () => this.toastService.error(this.i18n.t('dashboard.projects.menu.messages.deleteError')),
      });
  }

  private afterProjectMutation(): void {
    this.dashboardDataService.invalidateProjectsOverviewCache();
    this.closeProjectActions();
    this.loadProjects();
  }

  private computeProjectActionsPosition(trigger: HTMLElement | null, isArchived: boolean): { x: number; y: number } {
    if (!trigger) {
      return { x: 0, y: 0 };
    }

    const rect = trigger.getBoundingClientRect();
    const menuWidth = 224;
    const menuHeight = isArchived ? 154 : 198;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const gutter = 12;

    let x = rect.right - menuWidth;
    let y = rect.bottom + 8;

    if (x + menuWidth > viewportWidth - gutter) {
      x = viewportWidth - menuWidth - gutter;
    }
    if (x < gutter) {
      x = gutter;
    }

    if (y + menuHeight > viewportHeight - gutter) {
      y = rect.top - menuHeight - 8;
    }
    if (y < gutter) {
      y = gutter;
    }

    return { x, y };
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;

    if (!target?.closest('.projects-toolbar__dropdown')) {
      this.closeDropdowns();
    }

    if (!target?.closest('.projects-project-menu') && !target?.closest('[data-project-actions-trigger="true"]')) {
      this.closeProjectActions();
    }
  }

  trackByProject = (_: number, project: DashboardProjectItem): string => project.id;
}
