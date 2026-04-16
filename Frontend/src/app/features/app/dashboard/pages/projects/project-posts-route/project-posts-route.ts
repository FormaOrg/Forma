import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { finalize, map } from 'rxjs';

import { Project } from '../../../../../../core/models/project.model';
import { ProjectService } from '../../../../../../core/services/project.service';
import { I18nService } from '../../../../../landing-page/i18n/i18n.service';
import { TranslatePipe } from '../../../../../landing-page/i18n/translate.pipe';

type BlogPostStatus = 'published' | 'scheduled' | 'draft';

interface BlogPostItem {
  id: string;
  title: string;
  excerpt: string;
  status: BlogPostStatus;
  statusLabel: string;
  categoryLabel: string;
  readTimeLabel: string;
  viewsLabel: string;
  updatedLabel: string;
  hook: string;
  seoTitle: string;
  distributionLabel: string;
}

@Component({
  selector: 'app-project-posts-route',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe],
  templateUrl: './project-posts-route.html',
})
export class ProjectPostsRoute {
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
  readonly selectedPostId = signal('launch-story');
  readonly searchValue = signal('');
  readonly selectedStatus = signal<'ALL' | BlogPostStatus>('ALL');

  readonly posts = computed<BlogPostItem[]>(() => {
    const project = this.project();
    if (!project) {
      return [];
    }

    const updatedLabel = this.formatDate(project.updatedAt ?? project.createdAt);

    return [
      {
        id: 'launch-story',
        title: this.i18n.t('project.posts.mock.launch.title'),
        excerpt: `${this.i18n.t('project.posts.mock.launch.excerptPrefix')} ${project.name}.`,
        status: 'published',
        statusLabel: this.i18n.t('project.posts.status.published'),
        categoryLabel: this.i18n.t('project.posts.mock.category.strategy'),
        readTimeLabel: this.i18n.t('project.posts.mock.read6'),
        viewsLabel: this.i18n.t('project.posts.mock.views18k'),
        updatedLabel,
        hook: this.i18n.t('project.posts.mock.launch.hook'),
        seoTitle: this.i18n.t('project.posts.mock.launch.seoTitle'),
        distributionLabel: this.i18n.t('project.posts.mock.launch.distribution'),
      },
      {
        id: 'workflow-stack',
        title: this.i18n.t('project.posts.mock.workflow.title'),
        excerpt: this.i18n.t('project.posts.mock.workflow.excerpt'),
        status: 'scheduled',
        statusLabel: this.i18n.t('project.posts.status.scheduled'),
        categoryLabel: this.i18n.t('project.posts.mock.category.operations'),
        readTimeLabel: this.i18n.t('project.posts.mock.read4'),
        viewsLabel: this.i18n.t('project.posts.mock.queuedTuesday'),
        updatedLabel,
        hook: this.i18n.t('project.posts.mock.workflow.hook'),
        seoTitle: this.i18n.t('project.posts.mock.workflow.seoTitle'),
        distributionLabel: this.i18n.t('project.posts.mock.workflow.distribution'),
      },
      {
        id: 'design-systems',
        title: this.i18n.t('project.posts.mock.design.title'),
        excerpt: this.i18n.t('project.posts.mock.design.excerpt'),
        status: 'draft',
        statusLabel: this.i18n.t('project.posts.status.draft'),
        categoryLabel: this.i18n.t('project.posts.mock.category.design'),
        readTimeLabel: this.i18n.t('project.posts.mock.read7'),
        viewsLabel: this.i18n.t('project.posts.mock.draftReview'),
        updatedLabel,
        hook: this.i18n.t('project.posts.mock.design.hook'),
        seoTitle: this.i18n.t('project.posts.mock.design.seoTitle'),
        distributionLabel: this.i18n.t('project.posts.mock.design.distribution'),
      },
      {
        id: 'audience-signals',
        title: this.i18n.t('project.posts.mock.audience.title'),
        excerpt: this.i18n.t('project.posts.mock.audience.excerpt'),
        status: 'published',
        statusLabel: this.i18n.t('project.posts.status.published'),
        categoryLabel: this.i18n.t('project.posts.mock.category.growth'),
        readTimeLabel: this.i18n.t('project.posts.mock.read5'),
        viewsLabel: this.i18n.t('project.posts.mock.views940'),
        updatedLabel,
        hook: this.i18n.t('project.posts.mock.audience.hook'),
        seoTitle: this.i18n.t('project.posts.mock.audience.seoTitle'),
        distributionLabel: this.i18n.t('project.posts.mock.audience.distribution'),
      },
    ];
  });

  readonly filteredPosts = computed(() => {
    const query = this.searchValue().trim().toLowerCase();
    const status = this.selectedStatus();

    return this.posts().filter((post) => {
      const matchesQuery =
        !query ||
        post.title.toLowerCase().includes(query) ||
        post.categoryLabel.toLowerCase().includes(query) ||
        post.excerpt.toLowerCase().includes(query);
      const matchesStatus = status === 'ALL' || post.status === status;
      return matchesQuery && matchesStatus;
    });
  });

  readonly selectedPost = computed(
    () => this.filteredPosts().find((post) => post.id === this.selectedPostId()) ?? this.filteredPosts()[0] ?? null
  );
  readonly publishedCount = computed(() => this.posts().filter((post) => post.status === 'published').length);
  readonly scheduledCount = computed(() => this.posts().filter((post) => post.status === 'scheduled').length);
  readonly draftCount = computed(() => this.posts().filter((post) => post.status === 'draft').length);

  constructor() {
    this.loadProject();
  }

  loadProject(): void {
    const projectId = this.projectId();
    if (!projectId) {
      this.errorMessage.set(this.i18n.t('project.posts.errors.notFound'));
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
          this.selectedPostId.set('launch-story');
        },
        error: () => {
          this.project.set(null);
          this.errorMessage.set(this.i18n.t('project.posts.errors.load'));
        },
      });
  }

  updateSearch(value: string): void {
    this.searchValue.set(value);
  }

  setStatus(status: 'ALL' | BlogPostStatus): void {
    this.selectedStatus.set(status);
  }

  selectPost(postId: string): void {
    this.selectedPostId.set(postId);
  }

  trackPost = (_: number, post: BlogPostItem): string => post.id;

  private formatDate(value: string): string {
    const parsed = Date.parse(value);
    if (!Number.isFinite(parsed)) {
      return this.i18n.t('project.posts.time.recentlyUpdated');
    }

    return new Intl.DateTimeFormat(this.i18n.lang() === 'fr' ? 'fr-FR' : 'en-US', {
      month: 'short',
      day: 'numeric',
    }).format(parsed);
  }
}
