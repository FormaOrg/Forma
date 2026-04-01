import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { DashboardProjectItem } from '../../../../../core/models/dashboard.model';
import { DashboardDataService } from '../../../../../core/services/dashboard-data.service';
import { DataCard } from '../home/components/data-card/data-card';
import { ProjectCard, ProjectStatus } from './components/project-card/project-card';

type ProjectFilter = 'all' | ProjectStatus | 'archived';
type ProjectSort = 'last-edited' | 'name' | 'recently-created';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DataCard, ProjectCard],
  templateUrl: './projects.html',
  styleUrl: './projects.css',
})
export class Projects implements OnInit {
  private readonly dashboardDataService = inject(DashboardDataService);

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
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');

  readonly totalProjects = computed(() => this.projects().length);
  readonly publishedProjects = computed(() => this.projects().filter((project) => project.status === 'published').length);
  readonly draftProjects = computed(() => this.projects().filter((project) => project.status === 'draft').length);

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
          this.errorMessage.set(error?.error?.message ?? 'We could not load your projects right now.');
          this.projects.set([]);
        },
      });
  }

  updateSearchTerm(value: string): void {
    this.searchTerm.set(value);
  }

  updateFilter(filter: ProjectFilter): void {
    this.activeFilter.set(filter);
  }

  updateSort(sort: ProjectSort): void {
    this.activeSort.set(sort);
  }

  trackByProject = (_: number, project: DashboardProjectItem): string => project.id;
}
