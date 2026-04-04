import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { finalize, map } from 'rxjs';
import { Media } from '../../../../../../core/models/project.model';
import { ProjectService } from '../../../../../../core/services/project.service';
import { ToastService } from '../../../../../../core/services/toast.service';
import { UploadService } from '../../../../../../core/services/upload.service';

type MediaFilter = 'ALL' | Media['type'];

@Component({
  selector: 'app-project-media-route',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './project-media-route.html',
  styleUrl: './project-media-route.css',
})
export class ProjectMediaRoute {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly projectService = inject(ProjectService);
  readonly uploadService = inject(UploadService);
  private readonly toastService = inject(ToastService);

  readonly projectId = toSignal(
    this.route.parent!.paramMap.pipe(map((params) => Number(params.get('projectId') ?? '0'))),
    { initialValue: Number(this.route.parent?.snapshot.paramMap.get('projectId') ?? '0') }
  );

  readonly media = signal<Media[]>([]);
  readonly isLoading = signal(true);
  readonly isUploading = signal(false);
  readonly deletingId = signal<number | null>(null);
  readonly errorMessage = signal('');
  readonly selectedFilter = signal<MediaFilter>('ALL');

  readonly filteredMedia = computed(() => {
    const filter = this.selectedFilter();
    return filter === 'ALL' ? this.media() : this.media().filter((item) => item.type === filter);
  });
  readonly totalStorageLabel = computed(() =>
    this.uploadService.formatFileSize(this.media().reduce((sum, item) => sum + item.fileSize, 0))
  );
  readonly imageCount = computed(() => this.media().filter((item) => item.type === 'IMAGE').length);

  constructor() {
    this.loadMedia();
  }

  loadMedia(): void {
    const projectId = this.projectId();
    if (!projectId) {
      this.errorMessage.set('Project not found.');
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.projectService
      .getProjectMedia(projectId)
      .pipe(finalize(() => this.isLoading.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (media) => this.media.set(media),
        error: () => {
          this.media.set([]);
          this.errorMessage.set('Unable to load portfolio media right now.');
        },
      });
  }

  setFilter(filter: MediaFilter): void {
    this.selectedFilter.set(filter);
  }

  uploadMedia(event: Event): void {
    const projectId = this.projectId();
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0];

    if (!projectId || !input || !file) {
      return;
    }

    const validation = this.uploadService.validateMedia(file);
    if (!validation.valid) {
      this.toastService.error(validation.error ?? 'This image cannot be uploaded.');
      input.value = '';
      return;
    }

    this.isUploading.set(true);

    this.uploadService
      .uploadProjectMedia(file, projectId)
      .pipe(
        finalize(() => {
          this.isUploading.set(false);
          input.value = '';
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          this.toastService.success('Media uploaded.');
          this.loadMedia();
        },
        error: () => this.toastService.error('Unable to upload this media right now.'),
      });
  }

  deleteMediaItem(item: Media): void {
    const projectId = this.projectId();
    if (!projectId || this.deletingId() === item.id) {
      return;
    }

    this.deletingId.set(item.id);
    this.projectService
      .deleteMedia(projectId, item.id)
      .pipe(finalize(() => this.deletingId.set(null)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastService.success(`${item.fileName} removed.`);
          this.media.update((items) => items.filter((entry) => entry.id !== item.id));
        },
        error: () => this.toastService.error('Unable to delete this media right now.'),
      });
  }

  trackMedia = (_: number, item: Media): number => item.id;

  formatDate(value: string): string {
    const parsed = Date.parse(value);
    if (!Number.isFinite(parsed)) {
      return value;
    }

    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(parsed);
  }
}
