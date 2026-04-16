import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, map, merge } from 'rxjs';

import { Project, ProjectStatus, UpdateProjectRequest } from '../../../../../../core/models/project.model';
import { DashboardDataService } from '../../../../../../core/services/dashboard-data.service';
import { ProjectService } from '../../../../../../core/services/project.service';
import { ToastService } from '../../../../../../core/services/toast.service';
import { UploadService } from '../../../../../../core/services/upload.service';

type ProjectDangerAction = 'archive' | 'restore' | 'delete';

type SettingsFormValue = {
  name: string;
  storeTitle: string;
  contactPhone: string;
  storeEmail: string;
  defaultDomain: string;
  description: string;
  metaDescription: string;
  facebookUrl: string;
  instagramUrl: string;
  tiktokUrl: string;
  whatsappNumber: string;
};

@Component({
  selector: 'app-project-settings-route',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './project-settings-route.html',
})
export class ProjectSettingsRoute {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);
  private readonly projectService = inject(ProjectService);
  private readonly dashboardDataService = inject(DashboardDataService);
  private readonly toastService = inject(ToastService);
  private readonly uploadService = inject(UploadService);

  readonly projectId = toSignal(
    this.route.parent!.paramMap.pipe(map((params) => Number(params.get('projectId') ?? '0'))),
    { initialValue: Number(this.route.parent?.snapshot.paramMap.get('projectId') ?? '0') }
  );

  readonly project = signal<Project | null>(null);
  readonly isLoading = signal(true);
  readonly isSaving = signal(false);
  readonly isUploadingLogo = signal(false);
  readonly isArchiving = signal(false);
  readonly isDeleting = signal(false);
  readonly errorMessage = signal('');
  readonly showDangerModal = signal(false);
  readonly dangerAction = signal<ProjectDangerAction | null>(null);
  readonly originalValue = signal<SettingsFormValue | null>(null);
  readonly formStateVersion = signal(0);

  readonly settingsForm = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    storeTitle: ['', [Validators.maxLength(160)]],
    contactPhone: ['', [Validators.maxLength(40)]],
    storeEmail: ['', [Validators.email, Validators.maxLength(255)]],
    defaultDomain: ['', [Validators.maxLength(255)]],
    description: ['', [Validators.maxLength(2000)]],
    metaDescription: ['', [Validators.maxLength(500)]],
    facebookUrl: ['', [Validators.maxLength(255)]],
    instagramUrl: ['', [Validators.maxLength(255)]],
    tiktokUrl: ['', [Validators.maxLength(255)]],
    whatsappNumber: ['', [Validators.maxLength(255)]],
  });

  readonly isArchived = computed(() => this.project()?.status === 'ARCHIVED');
  readonly hasChanges = computed(() => {
    this.formStateVersion();

    const originalValue = this.originalValue();
    if (!originalValue) {
      return false;
    }

    const currentValue = this.getNormalizedFormValue();
    return JSON.stringify(currentValue) !== JSON.stringify(originalValue);
  });
  readonly canSave = computed(() => !this.isLoading() && !this.isSaving() && this.settingsForm.valid && this.hasChanges());
  readonly modalTitle = computed(() => {
    switch (this.dangerAction()) {
      case 'archive':
        return 'Archive this project?';
      case 'restore':
        return 'Restore this project?';
      default:
        return 'Delete this project?';
    }
  });
  readonly modalDescription = computed(() => {
    switch (this.dangerAction()) {
      case 'archive':
        return 'Archiving keeps the project data in place but marks the workspace as inactive until you decide to bring it back.';
      case 'restore':
        return 'Restoring moves this workspace back into your active projects so you can keep editing, publishing, and managing it normally again.';
      default:
        return 'Deleting this project removes the workspace and the linked project data permanently. This action cannot be undone.';
    }
  });
  readonly modalConfirmLabel = computed(() => {
    switch (this.dangerAction()) {
      case 'archive':
        return this.isArchiving() ? 'Archiving...' : 'Archive project';
      case 'restore':
        return this.isArchiving() ? 'Restoring...' : 'Restore project';
      default:
        return this.isDeleting() ? 'Deleting...' : 'Delete project';
    }
  });
  readonly statusLabel = computed(() => this.formatStatus(this.project()?.status ?? 'DRAFT'));
  readonly projectTypeLabel = computed(() => this.project() ? this.formatWords(this.project()!.type) : '');
  readonly creationMethodLabel = computed(() => this.project() ? this.formatWords(this.project()!.creationMethod) : '');

  constructor() {
    merge(this.settingsForm.valueChanges, this.settingsForm.statusChanges)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.formStateVersion.update((value) => value + 1));

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

    this.projectService.getProjectById(projectId)
      .pipe(finalize(() => this.isLoading.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (project) => {
          this.project.set(project);
          this.applyProjectToForm(project);
          this.closeDangerModal();
        },
        error: () => {
          this.project.set(null);
          this.errorMessage.set('Unable to load project settings right now.');
        },
      });
  }

  resetForm(): void {
    const project = this.project();
    if (!project || this.isSaving()) {
      return;
    }

    this.applyProjectToForm(project);
  }

  saveSettings(): void {
    if (!this.canSave()) {
      this.settingsForm.markAllAsTouched();
      return;
    }

    const projectId = this.projectId();
    if (!projectId) {
      return;
    }

    const raw = this.settingsForm.getRawValue();
    const payload: UpdateProjectRequest = {
      name: raw.name.trim(),
      storeTitle: this.blankToNull(raw.storeTitle),
      contactPhone: this.blankToNull(raw.contactPhone),
      storeEmail: this.blankToNull(raw.storeEmail),
      defaultDomain: this.blankToNull(raw.defaultDomain),
      description: this.blankToNull(raw.description) ?? undefined,
      metaDescription: this.blankToNull(raw.metaDescription) ?? undefined,
      facebookUrl: this.blankToNull(raw.facebookUrl),
      instagramUrl: this.blankToNull(raw.instagramUrl),
      tiktokUrl: this.blankToNull(raw.tiktokUrl),
      whatsappNumber: this.blankToNull(raw.whatsappNumber),
    };

    this.isSaving.set(true);
    this.projectService.updateProject(projectId, payload)
      .pipe(finalize(() => this.isSaving.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (project) => {
          this.project.set(project);
          this.applyProjectToForm(project);
          this.dashboardDataService.invalidateProjectsOverviewCache();
          this.toastService.success('Project settings updated.');
        },
        error: () => this.toastService.error('Unable to save project settings right now.'),
      });
  }

  uploadLogo(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0];
    const projectId = this.projectId();

    if (!file || !projectId) {
      if (input) {
        input.value = '';
      }
      return;
    }

    const validation = this.uploadService.validateProjectLogo(file);
    if (!validation.valid) {
      this.toastService.error(validation.error ?? 'Unable to upload this logo.');
      input.value = '';
      return;
    }

    this.isUploadingLogo.set(true);
    this.uploadService.uploadProjectLogo(file, projectId)
      .pipe(finalize(() => {
        this.isUploadingLogo.set(false);
        input.value = '';
      }), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const currentProject = this.project();
          if (currentProject) {
            this.project.set({
              ...currentProject,
              logoUrl: response.url,
            });
          }
          this.toastService.success(response.message || 'Project logo updated.');
        },
        error: (error) => {
          const message = error?.error?.message ?? 'Unable to upload project logo right now.';
          this.toastService.error(message);
        },
      });
  }

  removeLogo(): void {
    const currentProject = this.project();
    const projectId = this.projectId();

    if (!currentProject?.logoUrl || !projectId || this.isUploadingLogo()) {
      return;
    }

    this.isUploadingLogo.set(true);
    this.uploadService.deleteProjectLogo(projectId)
      .pipe(finalize(() => this.isUploadingLogo.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.project.set({
            ...currentProject,
            logoUrl: null,
          });
          this.toastService.success(response.message || 'Project logo removed.');
        },
        error: (error) => {
          const message = error?.error?.message ?? 'Unable to remove project logo right now.';
          this.toastService.error(message);
        },
      });
  }

  openDangerModal(action: ProjectDangerAction): void {
    if (action === 'archive' && this.isArchived()) {
      return;
    }

    this.dangerAction.set(action);
    this.showDangerModal.set(true);
  }

  closeDangerModal(): void {
    if (this.isArchiving() || this.isDeleting()) {
      return;
    }

    this.showDangerModal.set(false);
    this.dangerAction.set(null);
  }

  confirmDangerAction(): void {
    const action = this.dangerAction();
    const projectId = this.projectId();
    const project = this.project();

    if (!action || !projectId || !project) {
      return;
    }

    if (action === 'archive' || action === 'restore') {
      this.isArchiving.set(true);
      this.projectService.updateProject(projectId, {
        status: action === 'archive' ? 'ARCHIVED' : 'DRAFT',
        isPublished: false,
      })
        .pipe(finalize(() => this.isArchiving.set(false)), takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (updatedProject) => {
            this.isArchiving.set(false);
            this.project.set(updatedProject);
            this.applyProjectToForm(updatedProject);
            this.dashboardDataService.invalidateProjectsOverviewCache();
            this.closeDangerModal();
            this.toastService.success(action === 'archive' ? 'Project archived.' : 'Project restored.');
          },
          error: () => this.toastService.error(action === 'archive'
            ? 'Unable to archive this project right now.'
            : 'Unable to restore this project right now.'),
        });
      return;
    }

    this.isDeleting.set(true);
    this.projectService.deleteProject(projectId)
      .pipe(finalize(() => this.isDeleting.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isDeleting.set(false);
          this.dashboardDataService.invalidateProjectsOverviewCache();
          this.closeDangerModal();
          this.toastService.success(`Deleted ${project.name}.`);
          this.router.navigate(['/app/projects']);
        },
        error: () => this.toastService.error('Unable to delete this project right now.'),
      });
  }

  formatDate(value?: string | null): string {
    if (!value) {
      return 'Not available';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  private applyProjectToForm(project: Project): void {
    this.settingsForm.reset({
      name: project.name ?? '',
      storeTitle: project.storeTitle ?? '',
      contactPhone: project.contactPhone ?? '',
      storeEmail: project.storeEmail ?? '',
      defaultDomain: project.defaultDomain ?? '',
      description: project.description ?? '',
      metaDescription: project.metaDescription ?? '',
      facebookUrl: project.facebookUrl ?? '',
      instagramUrl: project.instagramUrl ?? '',
      tiktokUrl: project.tiktokUrl ?? '',
      whatsappNumber: project.whatsappNumber ?? '',
    });
    this.originalValue.set(this.getNormalizedFormValue());
    this.settingsForm.markAsPristine();
  }

  private getNormalizedFormValue(): SettingsFormValue {
    const raw = this.settingsForm.getRawValue();
    return {
      name: raw.name.trim(),
      storeTitle: raw.storeTitle.trim(),
      contactPhone: raw.contactPhone.trim(),
      storeEmail: raw.storeEmail.trim(),
      defaultDomain: raw.defaultDomain.trim(),
      description: raw.description.trim(),
      metaDescription: raw.metaDescription.trim(),
      facebookUrl: raw.facebookUrl.trim(),
      instagramUrl: raw.instagramUrl.trim(),
      tiktokUrl: raw.tiktokUrl.trim(),
      whatsappNumber: raw.whatsappNumber.trim(),
    };
  }

  private blankToNull(value: string): string | null {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  }

  private formatWords(value: string): string {
    return value
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/(^|\s)\S/g, (match) => match.toUpperCase());
  }

  private formatStatus(value: ProjectStatus): string {
    return value === 'PUBLISHED' ? 'Published' : value === 'ARCHIVED' ? 'Archived' : 'Draft';
  }
}
