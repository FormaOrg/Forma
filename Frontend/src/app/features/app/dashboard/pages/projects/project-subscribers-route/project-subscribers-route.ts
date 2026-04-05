import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { finalize, map } from 'rxjs';

import { Project } from '../../../../../../core/models/project.model';
import { ProjectService } from '../../../../../../core/services/project.service';

type SubscriberStatus = 'new' | 'engaged' | 'vip' | 'paused';

interface BlogSubscriberItem {
  id: number;
  name: string;
  email: string;
  status: SubscriberStatus;
  statusLabel: string;
  sourceLabel: string;
  tagLabel: string;
  joinedLabel: string;
  openRateLabel: string;
  lastTouchLabel: string;
}

@Component({
  selector: 'app-project-subscribers-route',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './project-subscribers-route.html',
})
export class ProjectSubscribersRoute {
  private readonly route = inject(ActivatedRoute);
  private readonly projectService = inject(ProjectService);

  readonly projectId = toSignal(
    this.route.parent!.paramMap.pipe(map((params) => Number(params.get('projectId') ?? '0'))),
    { initialValue: Number(this.route.parent?.snapshot.paramMap.get('projectId') ?? '0') }
  );

  readonly project = signal<Project | null>(null);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');
  readonly selectedSubscriberId = signal(1);
  readonly searchValue = signal('');

  readonly subscribers = computed<BlogSubscriberItem[]>(() => {
    if (!this.project()) {
      return [];
    }

    return [
      {
        id: 1,
        name: 'Lina Rahal',
        email: 'lina@northnote.co',
        status: 'vip',
        statusLabel: 'VIP reader',
        sourceLabel: 'Homepage form',
        tagLabel: 'Editorial strategy',
        joinedLabel: 'Joined this month',
        openRateLabel: '82% open rate',
        lastTouchLabel: 'Replied yesterday',
      },
      {
        id: 2,
        name: 'Youssef Karray',
        email: 'youssef@letters.studio',
        status: 'engaged',
        statusLabel: 'Engaged',
        sourceLabel: 'Lead magnet',
        tagLabel: 'Content ops',
        joinedLabel: 'Joined 3 weeks ago',
        openRateLabel: '61% open rate',
        lastTouchLabel: 'Clicked Monday issue',
      },
      {
        id: 3,
        name: 'Meriem B.',
        email: 'meriem@craftmemo.com',
        status: 'new',
        statusLabel: 'New',
        sourceLabel: 'Article inline form',
        tagLabel: 'Design systems',
        joinedLabel: 'Joined today',
        openRateLabel: 'Awaiting first send',
        lastTouchLabel: 'No activity yet',
      },
      {
        id: 4,
        name: 'Sami Ferchichi',
        email: 'sami@archive.school',
        status: 'paused',
        statusLabel: 'Paused',
        sourceLabel: 'Import',
        tagLabel: 'Growth',
        joinedLabel: 'Joined 2 months ago',
        openRateLabel: '12% open rate',
        lastTouchLabel: 'Needs re-engagement',
      },
    ];
  });

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
          this.selectedSubscriberId.set(1);
        },
        error: () => {
          this.project.set(null);
          this.errorMessage.set('Unable to load subscribers right now.');
        },
      });
  }

  updateSearch(value: string): void {
    this.searchValue.set(value);
  }

  selectSubscriber(subscriberId: number): void {
    this.selectedSubscriberId.set(subscriberId);
  }

  trackSubscriber = (_: number, subscriber: BlogSubscriberItem): number => subscriber.id;
}
