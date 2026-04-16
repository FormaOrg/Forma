import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { finalize, forkJoin, map } from 'rxjs';

import {
  BlogPostStatus,
  ProjectBlogPostItem,
} from '../../../../../../core/models/project-blog-workspace.model';
import { Project } from '../../../../../../core/models/project.model';
import { ProjectBlogWorkspaceService } from '../../../../../../core/services/project-blog-workspace.service';
import { ProjectService } from '../../../../../../core/services/project.service';
import { I18nService } from '../../../../../landing-page/i18n/i18n.service';
import { TranslatePipe } from '../../../../../landing-page/i18n/translate.pipe';

@Component({
  selector: 'app-project-posts-route',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe],
  templateUrl: './project-posts-route.html',
})
export class ProjectPostsRoute {
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
  readonly selectedPostId = signal('');
  readonly searchValue = signal('');
  readonly selectedStatus = signal<'ALL' | BlogPostStatus>('ALL');
  readonly posts = signal<ProjectBlogPostItem[]>([]);

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

    forkJoin({
      project: this.projectService.getProjectById(projectId),
      posts: this.projectBlogWorkspaceService.getPosts(projectId),
    })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: ({ project, posts }) => {
          this.project.set(project);
          this.posts.set(posts);
          this.selectedPostId.set(posts[0]?.id ?? '');
        },
        error: () => {
          this.project.set(null);
          this.posts.set([]);
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

  trackPost = (_: number, post: ProjectBlogPostItem): string => post.id;
}
