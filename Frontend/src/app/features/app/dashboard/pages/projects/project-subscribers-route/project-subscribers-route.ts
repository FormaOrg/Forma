import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { finalize, forkJoin, map } from 'rxjs';

import { ProjectBlogSubscriberItem } from '../../../../../../core/models/project-blog-workspace.model';
import { Project } from '../../../../../../core/models/project.model';
import { ProjectBlogWorkspaceService } from '../../../../../../core/services/project-blog-workspace.service';
import { ProjectService } from '../../../../../../core/services/project.service';
import { I18nService } from '../../../../../landing-page/i18n/i18n.service';
import { TranslatePipe } from '../../../../../landing-page/i18n/translate.pipe';

@Component({
  selector: 'app-project-subscribers-route',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe],
  templateUrl: './project-subscribers-route.html',
})
export class ProjectSubscribersRoute {
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
  readonly selectedSubscriberId = signal(0);
  readonly searchValue = signal('');
  readonly subscribers = signal<ProjectBlogSubscriberItem[]>([]);

  readonly filteredSubscribers = computed(() => {
    const query = this.searchValue().trim().toLowerCase();

    return this.subscribers().filter((subscriber) => {
      return (
        !query ||
        subscriber.name.toLowerCase().includes(query) ||
        subscriber.email.toLowerCase().includes(query) ||
        subscriber.tagLabel.toLowerCase().includes(query)
      );
    });
  });

  readonly selectedSubscriber = computed(
    () =>
      this.filteredSubscribers().find((subscriber) => subscriber.id === this.selectedSubscriberId()) ??
      this.filteredSubscribers()[0] ??
      null
  );
  readonly activeSubscribers = computed(
    () => this.subscribers().filter((subscriber) => subscriber.status !== 'paused').length
  );
  readonly engagedSubscribers = computed(
    () => this.subscribers().filter((subscriber) => subscriber.status === 'engaged' || subscriber.status === 'vip').length
  );

  constructor() {
    this.loadProject();
  }

  loadProject(): void {
    const projectId = this.projectId();
    if (!projectId) {
      this.errorMessage.set(this.i18n.t('project.subscribers.errors.notFound'));
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    forkJoin({
      project: this.projectService.getProjectById(projectId),
      subscribers: this.projectBlogWorkspaceService.getSubscribers(projectId),
    })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: ({ project, subscribers }) => {
          this.project.set(project);
          this.subscribers.set(subscribers);
          this.selectedSubscriberId.set(subscribers[0]?.id ?? 0);
        },
        error: () => {
          this.project.set(null);
          this.subscribers.set([]);
          this.errorMessage.set(this.i18n.t('project.subscribers.errors.load'));
        },
      });
  }

  updateSearch(value: string): void {
    this.searchValue.set(value);
  }

  selectSubscriber(subscriberId: number): void {
    this.selectedSubscriberId.set(subscriberId);
  }

  trackSubscriber = (_: number, subscriber: ProjectBlogSubscriberItem): number => subscriber.id;
}
