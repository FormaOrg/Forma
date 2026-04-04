import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { finalize, map } from 'rxjs';

import { Project } from '../../../../../../core/models/project.model';
import { ProjectService } from '../../../../../../core/services/project.service';

type CategoryState = 'healthy' | 'expanding' | 'light';

interface BlogCategoryItem {
  id: string;
  name: string;
  description: string;
  pillarLabel: string;
  postCount: number;
  draftCount: number;
  shareLabel: string;
  state: CategoryState;
  stateLabel: string;
  cadenceLabel: string;
  nextAngle: string;
}

@Component({
  selector: 'app-project-categories-route',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './project-categories-route.html',
  styleUrl: './project-categories-route.css',
})
export class ProjectCategoriesRoute {
  private readonly route = inject(ActivatedRoute);
  private readonly projectService = inject(ProjectService);

  readonly projectId = toSignal(
    this.route.parent!.paramMap.pipe(map((params) => Number(params.get('projectId') ?? '0'))),
    { initialValue: Number(this.route.parent?.snapshot.paramMap.get('projectId') ?? '0') }
  );

  readonly project = signal<Project | null>(null);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');
  readonly selectedCategoryId = signal('strategy');

  readonly categories = computed<BlogCategoryItem[]>(() => {
    const project = this.project();
    if (!project) {
      return [];
    }

    return [
      {
        id: 'strategy',
        name: 'Strategy',
        description: `${project.name} uses this pillar for positioning, editorial point of view, and practical thinking pieces.`,
        pillarLabel: 'Core pillar',
        postCount: 8,
        draftCount: 2,
        shareLabel: '34% of all traffic',
        state: 'healthy',
        stateLabel: 'Healthy',
        cadenceLabel: 'Weekly',
        nextAngle: 'Publish a follow-up on content planning cycles.',
      },
      {
        id: 'operations',
        name: 'Operations',
        description: 'Document the systems, workflows, and behind-the-scenes mechanics that support the brand.',
        pillarLabel: 'Support pillar',
        postCount: 5,
        draftCount: 1,
        shareLabel: '22% of all traffic',
        state: 'expanding',
        stateLabel: 'Expanding',
        cadenceLabel: 'Twice a month',
        nextAngle: 'Turn the content review checklist into a tactical article.',
      },
      {
        id: 'design',
        name: 'Design',
        description: 'Use design-led stories to connect structure, usability, and taste with outcomes.',
        pillarLabel: 'Visual pillar',
        postCount: 4,
        draftCount: 2,
        shareLabel: '18% of all traffic',
        state: 'expanding',
        stateLabel: 'Expanding',
        cadenceLabel: 'Twice a month',
        nextAngle: 'Package a post around component systems for editorial teams.',
      },
      {
        id: 'growth',
        name: 'Growth',
        description: 'Cover audience signals, subscriber health, and what helps the archive compound over time.',
        pillarLabel: 'Audience pillar',
        postCount: 3,
        draftCount: 1,
        shareLabel: '11% of all traffic',
        state: 'light',
        stateLabel: 'Light coverage',
        cadenceLabel: 'Monthly',
        nextAngle: 'Write a piece on retention signals beyond open rate.',
      },
    ];
  });

  readonly selectedCategory = computed(
    () => this.categories().find((category) => category.id === this.selectedCategoryId()) ?? this.categories()[0] ?? null
  );
  readonly totalPosts = computed(() => this.categories().reduce((sum, category) => sum + category.postCount, 0));
  readonly totalDrafts = computed(() => this.categories().reduce((sum, category) => sum + category.draftCount, 0));

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
          this.selectedCategoryId.set('strategy');
        },
        error: () => {
          this.project.set(null);
          this.errorMessage.set('Unable to load blog categories right now.');
        },
      });
  }

  selectCategory(categoryId: string): void {
    this.selectedCategoryId.set(categoryId);
  }

  trackCategory = (_: number, category: BlogCategoryItem): string => category.id;
}
