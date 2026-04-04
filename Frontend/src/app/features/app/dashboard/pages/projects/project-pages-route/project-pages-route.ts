import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { finalize, map } from 'rxjs';
import { Project } from '../../../../../../core/models/project.model';
import { ProjectService } from '../../../../../../core/services/project.service';

type PortfolioPageStatus = 'published' | 'in-progress' | 'draft';

interface PortfolioPageItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  status: PortfolioPageStatus;
  statusLabel: string;
  sectionCount: number;
  seoLabel: string;
  updatedLabel: string;
  featured: boolean;
}

@Component({
  selector: 'app-project-pages-route',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './project-pages-route.html',
  styleUrl: './project-pages-route.css',
})
export class ProjectPagesRoute {
  private readonly route = inject(ActivatedRoute);
  private readonly projectService = inject(ProjectService);

  readonly projectId = toSignal(
    this.route.parent!.paramMap.pipe(map((params) => Number(params.get('projectId') ?? '0'))),
    { initialValue: Number(this.route.parent?.snapshot.paramMap.get('projectId') ?? '0') }
  );

  readonly project = signal<Project | null>(null);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');
  readonly selectedPageId = signal('home');

  readonly pages = computed<PortfolioPageItem[]>(() => {
    const project = this.project();
    if (!project) {
      return [];
    }

    const updatedLabel = this.formatDate(project.updatedAt ?? project.createdAt);

    return [
      {
        id: 'home',
        title: 'Home',
        slug: '/',
        description: `Lead with ${project.name}, your headline work, and a clear first impression.`,
        status: 'published',
        statusLabel: 'Published',
        sectionCount: 6,
        seoLabel: 'Optimized',
        updatedLabel,
        featured: true,
      },
      {
        id: 'about',
        title: 'About',
        slug: '/about',
        description: 'Tell your story, process, and experience in a way that supports your positioning.',
        status: 'published',
        statusLabel: 'Published',
        sectionCount: 4,
        seoLabel: 'Healthy',
        updatedLabel,
        featured: false,
      },
      {
        id: 'work',
        title: 'Projects',
        slug: '/projects',
        description: 'Show selected case studies, visuals, and the outcome behind each client or personal piece.',
        status: 'in-progress',
        statusLabel: 'In progress',
        sectionCount: 5,
        seoLabel: 'Needs meta copy',
        updatedLabel,
        featured: false,
      },
      {
        id: 'contact',
        title: 'Contact',
        slug: '/contact',
        description: 'Collect inquiries with a focused contact page and the right call to action.',
        status: 'draft',
        statusLabel: 'Draft',
        sectionCount: 3,
        seoLabel: 'Not reviewed',
        updatedLabel,
        featured: false,
      },
    ];
  });

  readonly selectedPage = computed(
    () => this.pages().find((page) => page.id === this.selectedPageId()) ?? this.pages()[0] ?? null
  );
  readonly publishedCount = computed(() => this.pages().filter((page) => page.status === 'published').length);
  readonly totalSections = computed(() => this.pages().reduce((sum, page) => sum + page.sectionCount, 0));

  constructor() {
    this.loadProject();
  }

  loadProject(): void {
    const projectId = this.projectId();
    if (!projectId) {
      this.errorMessage.set('Project not found.');
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.projectService
      .getProjectById(projectId)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (project) => {
          this.project.set(project);
          this.selectedPageId.set('home');
        },
        error: () => {
          this.project.set(null);
          this.errorMessage.set('Unable to load portfolio pages right now.');
        },
      });
  }

  selectPage(pageId: string): void {
    this.selectedPageId.set(pageId);
  }

  trackPage = (_: number, page: PortfolioPageItem): string => page.id;

  private formatDate(value: string): string {
    const parsed = Date.parse(value);
    if (!Number.isFinite(parsed)) {
      return 'Recently updated';
    }

    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
    }).format(parsed);
  }
}
