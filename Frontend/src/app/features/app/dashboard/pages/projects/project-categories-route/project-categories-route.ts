import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { finalize, map } from 'rxjs';

import { Project } from '../../../../../../core/models/project.model';
import { ProjectService } from '../../../../../../core/services/project.service';
import { I18nService } from '../../../../../landing-page/i18n/i18n.service';
import { TranslatePipe } from '../../../../../landing-page/i18n/translate.pipe';

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
  imports: [CommonModule, RouterLink, TranslatePipe],
  templateUrl: './project-categories-route.html',
  styleUrl: './project-categories-route.css',
})
export class ProjectCategoriesRoute {
  private readonly route = inject(ActivatedRoute);
  private readonly projectService = inject(ProjectService);
  private readonly i18n = inject(I18nService);

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
        name: this.i18n.t('project.categories.mock.strategy.name'),
        description: `${project.name} ${this.i18n.t('project.categories.mock.strategy.descriptionSuffix')}`,
        pillarLabel: this.i18n.t('project.categories.mock.pillar.core'),
        postCount: 8,
        draftCount: 2,
        shareLabel: this.i18n.t('project.categories.mock.share.34'),
        state: 'healthy',
        stateLabel: this.i18n.t('project.categories.state.healthy'),
        cadenceLabel: this.i18n.t('project.categories.mock.cadence.weekly'),
        nextAngle: this.i18n.t('project.categories.mock.nextAngle.strategy'),
      },
      {
        id: 'operations',
        name: this.i18n.t('project.categories.mock.operations.name'),
        description: this.i18n.t('project.categories.mock.operations.description'),
        pillarLabel: this.i18n.t('project.categories.mock.pillar.support'),
        postCount: 5,
        draftCount: 1,
        shareLabel: this.i18n.t('project.categories.mock.share.22'),
        state: 'expanding',
        stateLabel: this.i18n.t('project.categories.state.expanding'),
        cadenceLabel: this.i18n.t('project.categories.mock.cadence.twiceMonth'),
        nextAngle: this.i18n.t('project.categories.mock.nextAngle.operations'),
      },
      {
        id: 'design',
        name: this.i18n.t('project.categories.mock.design.name'),
        description: this.i18n.t('project.categories.mock.design.description'),
        pillarLabel: this.i18n.t('project.categories.mock.pillar.visual'),
        postCount: 4,
        draftCount: 2,
        shareLabel: this.i18n.t('project.categories.mock.share.18'),
        state: 'expanding',
        stateLabel: this.i18n.t('project.categories.state.expanding'),
        cadenceLabel: this.i18n.t('project.categories.mock.cadence.twiceMonth'),
        nextAngle: this.i18n.t('project.categories.mock.nextAngle.design'),
      },
      {
        id: 'growth',
        name: this.i18n.t('project.categories.mock.growth.name'),
        description: this.i18n.t('project.categories.mock.growth.description'),
        pillarLabel: this.i18n.t('project.categories.mock.pillar.audience'),
        postCount: 3,
        draftCount: 1,
        shareLabel: this.i18n.t('project.categories.mock.share.11'),
        state: 'light',
        stateLabel: this.i18n.t('project.categories.state.light'),
        cadenceLabel: this.i18n.t('project.categories.mock.cadence.monthly'),
        nextAngle: this.i18n.t('project.categories.mock.nextAngle.growth'),
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
      this.errorMessage.set(this.i18n.t('project.categories.errors.notFound'));
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
          this.errorMessage.set(this.i18n.t('project.categories.errors.load'));
        },
      });
  }

  selectCategory(categoryId: string): void {
    this.selectedCategoryId.set(categoryId);
  }

  trackCategory = (_: number, category: BlogCategoryItem): string => category.id;
}
