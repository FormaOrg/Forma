import { CommonModule } from '@angular/common';
import { Component, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { computed, inject, signal } from '@angular/core';

import {
  getCompletedProjectSetupItems,
  getProjectSetupNextStep,
  getProjectSetupItems
} from '../../../../../../shared/app/project-setup/project-setup.data';
import { ProjectService } from '../../../../../../core/services/project.service';
import { ProjectWorkspaceContextService } from '../../../../../../core/services/project-workspace-context.service';
import { ProjectType } from '../../../../../../core/models/project.model';
import { getProjectWorkspaceConfig } from '../../../../../../shared/app/project-workspace/project-workspace.config';
import { TranslatePipe } from '../../../../../landing-page/i18n/translate.pipe';

@Component({
  selector: 'app-project-route-placeholder',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslatePipe],
  templateUrl: './project-route-placeholder.html',
  styleUrl: './project-route-placeholder.css',
  encapsulation: ViewEncapsulation.None,
})
export class ProjectRoutePlaceholder {
  private readonly route = inject(ActivatedRoute);
  private readonly projectService = inject(ProjectService);
  private readonly projectWorkspaceContextService = inject(ProjectWorkspaceContextService);

  readonly title = toSignal(
    this.route.data.pipe(map((data) => String(data['title'] ?? 'Project'))),
    { initialValue: String(this.route.snapshot.data['title'] ?? 'Project') }
  );

  readonly projectId = toSignal(
    this.route.parent!.paramMap.pipe(map((params) => params.get('projectId') ?? '')),
    { initialValue: this.route.parent?.snapshot.paramMap.get('projectId') ?? '' }
  );
  readonly projectType = signal<ProjectType | null>(null);
  readonly workspaceConfig = computed(() => getProjectWorkspaceConfig(this.projectType()));
  readonly setupItems = computed(() => getProjectSetupItems(this.projectType()));
  readonly completedSetupItems = computed(() => getCompletedProjectSetupItems(this.setupItems()));
  readonly nextSetupStep = computed(() => getProjectSetupNextStep(this.setupItems()));
  readonly ownerName = 'Ismail';
  readonly projectStatusItems = [
    { label: 'Free plan', accent: false },
    { label: 'Compare plans', accent: true },
    { label: 'No subdomain', accent: false },
    { label: 'Connect subdomain', accent: true },
    { label: 'Edit business info', accent: false }
  ] as const;
  readonly analyticsCards = [
    { label: 'Site sessions', value: '-', helper: 'Available after publish' },
    { label: 'Total sales', value: '-', helper: 'Connected once checkout goes live' }
  ] as const;
  readonly featuredActivity = {
    title: 'Domain connection pending',
    description: 'Finish your custom subdomain setup to start receiving visits on your branded URL.',
    actionLabel: 'Continue setup'
  } as const;
  readonly activityItems = [
    {
      title: 'Homepage draft updated',
      description: 'Your latest layout changes are saved and ready for the next review.',
      timeLabel: 'A few minutes ago',
      actionLabel: 'Open editor'
    },
    {
      title: 'Product catalog ready',
      description: 'Collections and featured products were prepared for your storefront.',
      timeLabel: 'Earlier today',
      actionLabel: 'Review catalog'
    }
  ] as const;
  readonly suggestedItems = [
    {
      title: 'Edit your business info',
      description: 'Add your business name, contact details, and core brand details so the site feels complete.',
      actionLabel: 'Add info'
    },
    {
      title: 'Connect a custom subdomain',
      description: 'Launch with a branded URL that customers can remember and trust.',
      actionLabel: 'Connect'
    }
  ] as const;

  constructor() {
    this.loadProjectType();
  }

  private loadProjectType(): void {
    const projectId = Number(this.projectId());

    if (!Number.isFinite(projectId) || projectId <= 0) {
      this.projectType.set(null);
      return;
    }

    const cachedType = this.projectWorkspaceContextService.getProjectType(projectId);
    if (cachedType) {
      this.projectType.set(cachedType);
      return;
    }

    this.projectService.getProjectById(projectId)
      .subscribe({
        next: (project) => {
          this.projectWorkspaceContextService.setProjectType(projectId, project.type);
          this.projectType.set(project.type);
        },
        error: () => this.projectType.set(null),
      });
  }
}
