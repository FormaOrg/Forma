import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { finalize, map } from 'rxjs';

import { Project } from '../../../../../../core/models/project.model';
import { ProjectService } from '../../../../../../core/services/project.service';

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
  imports: [CommonModule, RouterLink],
  templateUrl: './project-posts-route.html',
  styleUrl: './project-posts-route.css',
})
export class ProjectPostsRoute {
  private readonly route = inject(ActivatedRoute);
  private readonly projectService = inject(ProjectService);

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
        title: 'How to launch a sharper editorial voice in 30 days',
        excerpt: `A practical publishing plan inspired by the positioning behind ${project.name}.`,
        status: 'published',
        statusLabel: 'Published',
        categoryLabel: 'Strategy',
        readTimeLabel: '6 min read',
        viewsLabel: '1.8k views',
        updatedLabel,
        hook: 'Turn your blog into a consistent point of view instead of a list of updates.',
        seoTitle: 'Launch a sharper editorial voice in 30 days',
        distributionLabel: 'Newsletter and homepage feature',
      },
      {
        id: 'workflow-stack',
        title: 'The content workflow stack our team actually sticks to',
        excerpt: 'The templates, review rules, and publishing cadence that keep content shipping each week.',
        status: 'scheduled',
        statusLabel: 'Scheduled',
        categoryLabel: 'Operations',
        readTimeLabel: '4 min read',
        viewsLabel: 'Queued for Tuesday',
        updatedLabel,
        hook: 'A practical view of the writing pipeline from outline to publish.',
        seoTitle: 'The content workflow stack teams actually stick to',
        distributionLabel: 'Scheduled for email and social',
      },
      {
        id: 'design-systems',
        title: 'Design systems that help writers move faster',
        excerpt: 'Why reusable blocks and content patterns matter just as much as visual consistency.',
        status: 'draft',
        statusLabel: 'Draft',
        categoryLabel: 'Design',
        readTimeLabel: '7 min read',
        viewsLabel: 'Draft in review',
        updatedLabel,
        hook: 'Better structure means less friction when writers need to publish quickly.',
        seoTitle: 'Design systems that help writers publish faster',
        distributionLabel: 'Internal review only',
      },
      {
        id: 'audience-signals',
        title: 'What early subscriber signals are worth paying attention to',
        excerpt: 'A short guide to judging traction before your list is large.',
        status: 'published',
        statusLabel: 'Published',
        categoryLabel: 'Growth',
        readTimeLabel: '5 min read',
        viewsLabel: '940 views',
        updatedLabel,
        hook: 'Use replies, saves, and repeat opens to find what readers actually want more of.',
        seoTitle: 'Which early subscriber signals actually matter',
        distributionLabel: 'Newsletter and archive',
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
          this.selectedPostId.set('launch-story');
        },
        error: () => {
          this.project.set(null);
          this.errorMessage.set('Unable to load blog posts right now.');
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
      return 'Recently updated';
    }

    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
    }).format(parsed);
  }
}
