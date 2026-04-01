import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DataCard } from '../home/components/data-card/data-card';
import { ProjectCard, ProjectCardItem, ProjectStatus } from './components/project-card/project-card';

type ProjectFilter = 'all' | ProjectStatus;
type ProjectSort = 'last-edited' | 'name' | 'recently-created';

type ProjectItem = ProjectCardItem & {
  description: string;
  lastEditedAt: number;
  createdAt: number;
};

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DataCard, ProjectCard],
  templateUrl: './projects.html',
  styleUrl: './projects.css',
})
export class Projects {
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

  readonly projects = signal<ProjectItem[]>([
    {
      id: 'portfolio-studio',
      name: 'Portfolio Studio',
      status: 'published',
      domain: 'portfolio-studio.forma.site',
      lastEditedLabel: '2 hours ago',
      createdLabel: '6 weeks ago',
      description: 'Personal brand site with animated case studies and a client-ready contact flow.',
      accent: '#7566ff',
      lastEditedAt: Date.parse('2026-03-31T11:30:00Z'),
      createdAt: Date.parse('2026-02-12T10:00:00Z'),
      route: '/app/projects/portfolio-studio',
    },
    {
      id: 'bloom-cafe',
      name: 'Bloom Cafe',
      status: 'draft',
      lastEditedLabel: 'Yesterday',
      createdLabel: '3 days ago',
      description: 'Neighborhood cafe concept with seasonal menus, reservations, and takeaway promos.',
      accent: '#f29d64',
      lastEditedAt: Date.parse('2026-03-30T16:10:00Z'),
      createdAt: Date.parse('2026-03-28T09:00:00Z'),
      route: '/app/projects/bloom-cafe',
    },
    {
      id: 'nova-agency',
      name: 'Nova Agency',
      status: 'published',
      domain: 'nova-agency.forma.site',
      lastEditedLabel: '4 days ago',
      createdLabel: '2 months ago',
      description: 'Agency showcase with service landing pages, lead capture, and testimonial blocks.',
      accent: '#59b6d9',
      lastEditedAt: Date.parse('2026-03-27T12:00:00Z'),
      createdAt: Date.parse('2026-01-26T08:30:00Z'),
      route: '/app/projects/nova-agency',
    },
    {
      id: 'fit-journal',
      name: 'Fit Journal',
      status: 'draft',
      lastEditedLabel: '1 week ago',
      createdLabel: '2 weeks ago',
      description: 'Habit-focused wellness site with classes, newsletters, and a clean editorial rhythm.',
      accent: '#6ec58d',
      lastEditedAt: Date.parse('2026-03-24T13:20:00Z'),
      createdAt: Date.parse('2026-03-18T14:00:00Z'),
      route: '/app/projects/fit-journal',
    },
  ]);

  readonly searchTerm = signal('');
  readonly activeFilter = signal<ProjectFilter>('all');
  readonly activeSort = signal<ProjectSort>('last-edited');

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
        project.description.toLowerCase().includes(query);
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

  updateSearchTerm(value: string): void {
    this.searchTerm.set(value);
  }

  updateFilter(filter: ProjectFilter): void {
    this.activeFilter.set(filter);
  }

  updateSort(sort: ProjectSort): void {
    this.activeSort.set(sort);
  }

  trackByProject = (_: number, project: ProjectItem): string => project.id;
}
