import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { finalize, forkJoin, map } from 'rxjs';

import { ProjectBlogCategoryItem } from '../../../../../../core/models/project-blog-workspace.model';
import { Project } from '../../../../../../core/models/project.model';
import { ProjectBlogWorkspaceService } from '../../../../../../core/services/project-blog-workspace.service';
import { ProjectService } from '../../../../../../core/services/project.service';
import { I18nService } from '../../../../../landing-page/i18n/i18n.service';
import { TranslatePipe } from '../../../../../landing-page/i18n/translate.pipe';

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
  private readonly projectBlogWorkspaceService = inject(ProjectBlogWorkspaceService);
  private readonly i18n = inject(I18nService);

  readonly projectId = toSignal(
    this.route.parent!.paramMap.pipe(map((params) => Number(params.get('projectId') ?? '0'))),
    { initialValue: Number(this.route.parent?.snapshot.paramMap.get('projectId') ?? '0') }
  );

  readonly project = signal<Project | null>(null);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');
  readonly selectedCategoryId = signal('');
  readonly categories = signal<ProjectBlogCategoryItem[]>([]);

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

    forkJoin({
      project: this.projectService.getProjectById(projectId),
      categories: this.projectBlogWorkspaceService.getCategories(projectId),
    })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: ({ project, categories }) => {
          this.project.set(project);
          this.categories.set(categories);
          this.selectedCategoryId.set(categories[0]?.id ?? '');
        },
        error: () => {
          this.project.set(null);
          this.categories.set([]);
          this.errorMessage.set(this.i18n.t('project.categories.errors.load'));
        },
      });
  }

  selectCategory(categoryId: string): void {
    this.selectedCategoryId.set(categoryId);
  }

  trackCategory = (_: number, category: ProjectBlogCategoryItem): string => category.id;
}
