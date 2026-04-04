import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { finalize, map } from 'rxjs';
import { ProjectHomeService } from '../../../../../../core/services/project-home.service';
import { ProjectHomePage } from '../../../../../../core/models/project-home.model';

@Component({
  selector: 'app-project-home-route',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './project-home-route.html',
  styleUrl: './project-home-route.css',
})
export class ProjectHomeRoute {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly projectHomeService = inject(ProjectHomeService);

  readonly projectId = toSignal(
    this.route.parent!.paramMap.pipe(map((params) => Number(params.get('projectId') ?? '0'))),
    { initialValue: Number(this.route.parent?.snapshot.paramMap.get('projectId') ?? '0') }
  );

  readonly page = signal<ProjectHomePage | null>(null);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');
  readonly metrics = computed(() => this.page()?.metrics ?? []);
  readonly activities = computed(() => this.page()?.recentActivities ?? []);
  readonly actions = computed(() => this.page()?.suggestedActions ?? []);
  readonly statusPills = computed(() => {
    const page = this.page();
    if (!page) {
      return [];
    }

    return [
      { label: page.projectStatus.replaceAll('_', ' '), accent: page.published },
      { label: page.projectType.replaceAll('_', ' '), accent: false },
      { label: page.creationMethod.replaceAll('_', ' '), accent: false },
    ];
  });

  constructor() {
    this.loadHomePage();
  }

  loadHomePage(): void {
    const projectId = this.projectId();
    if (!projectId) {
      this.errorMessage.set('Project not found.');
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.projectHomeService.getHomePage(projectId)
      .pipe(finalize(() => this.isLoading.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (page) => this.page.set(page),
        error: () => {
          this.page.set(null);
          this.errorMessage.set('Unable to load this project workspace right now.');
        },
      });
  }

  formatOccurredAt(value: string): string {
    const parsed = Date.parse(value);
    if (!Number.isFinite(parsed)) {
      return value;
    }

    const minutes = Math.round((parsed - Date.now()) / 60000);
    const absoluteMinutes = Math.abs(minutes);
    const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

    if (absoluteMinutes < 60) {
      return formatter.format(minutes, 'minute');
    }

    const hours = Math.round(minutes / 60);
    if (Math.abs(hours) < 24) {
      return formatter.format(hours, 'hour');
    }

    const days = Math.round(hours / 24);
    return formatter.format(days, 'day');
  }
}
