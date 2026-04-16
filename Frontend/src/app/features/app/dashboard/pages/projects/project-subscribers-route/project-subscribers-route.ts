import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { finalize, map } from 'rxjs';

import { Project } from '../../../../../../core/models/project.model';
import { ProjectService } from '../../../../../../core/services/project.service';
import { I18nService } from '../../../../../landing-page/i18n/i18n.service';
import { TranslatePipe } from '../../../../../landing-page/i18n/translate.pipe';

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
  imports: [CommonModule, RouterLink, TranslatePipe],
  templateUrl: './project-subscribers-route.html',
})
export class ProjectSubscribersRoute {
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
        statusLabel: this.i18n.t('project.subscribers.status.vip'),
        sourceLabel: this.i18n.t('project.subscribers.mock.source.homepageForm'),
        tagLabel: this.i18n.t('project.subscribers.mock.tag.editorialStrategy'),
        joinedLabel: this.i18n.t('project.subscribers.mock.joined.thisMonth'),
        openRateLabel: this.i18n.t('project.subscribers.mock.openRate.82'),
        lastTouchLabel: this.i18n.t('project.subscribers.mock.lastTouch.repliedYesterday'),
      },
      {
        id: 2,
        name: 'Youssef Karray',
        email: 'youssef@letters.studio',
        status: 'engaged',
        statusLabel: this.i18n.t('project.subscribers.status.engaged'),
        sourceLabel: this.i18n.t('project.subscribers.mock.source.leadMagnet'),
        tagLabel: this.i18n.t('project.subscribers.mock.tag.contentOps'),
        joinedLabel: this.i18n.t('project.subscribers.mock.joined.threeWeeksAgo'),
        openRateLabel: this.i18n.t('project.subscribers.mock.openRate.61'),
        lastTouchLabel: this.i18n.t('project.subscribers.mock.lastTouch.clickedMonday'),
      },
      {
        id: 3,
        name: 'Meriem B.',
        email: 'meriem@craftmemo.com',
        status: 'new',
        statusLabel: this.i18n.t('project.subscribers.status.new'),
        sourceLabel: this.i18n.t('project.subscribers.mock.source.inlineForm'),
        tagLabel: this.i18n.t('project.subscribers.mock.tag.designSystems'),
        joinedLabel: this.i18n.t('project.subscribers.mock.joined.today'),
        openRateLabel: this.i18n.t('project.subscribers.mock.openRate.awaitingFirstSend'),
        lastTouchLabel: this.i18n.t('project.subscribers.mock.lastTouch.noneYet'),
      },
      {
        id: 4,
        name: 'Sami Ferchichi',
        email: 'sami@archive.school',
        status: 'paused',
        statusLabel: this.i18n.t('project.subscribers.status.paused'),
        sourceLabel: this.i18n.t('project.subscribers.mock.source.import'),
        tagLabel: this.i18n.t('project.subscribers.mock.tag.growth'),
        joinedLabel: this.i18n.t('project.subscribers.mock.joined.twoMonthsAgo'),
        openRateLabel: this.i18n.t('project.subscribers.mock.openRate.12'),
        lastTouchLabel: this.i18n.t('project.subscribers.mock.lastTouch.needsReengagement'),
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
      this.errorMessage.set(this.i18n.t('project.subscribers.errors.notFound'));
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

  trackSubscriber = (_: number, subscriber: BlogSubscriberItem): number => subscriber.id;
}
