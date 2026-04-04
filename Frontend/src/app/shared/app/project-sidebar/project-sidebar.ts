import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges, computed, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AppIcon, AppIconName } from '../icons/app-icon';
import { ThemeService } from '../../../core/services/theme.service';
import { ProjectService } from '../../../core/services/project.service';
import { ProjectType } from '../../../core/models/project.model';
import type { SidebarItem, SidebarSection } from '../dashboard-nav.types';
import {
  getCompletedProjectSetupItems,
  getProjectSetupNextStep,
  PROJECT_SETUP_ITEMS
} from '../project-setup/project-setup.data';
import { getProjectWorkspaceConfig } from '../project-workspace/project-workspace.config';

type ProjectSidebarItem = SidebarItem & { path: string };

@Component({
  selector: 'app-project-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, AppIcon],
  templateUrl: './project-sidebar.html',
  styleUrl: './project-sidebar.css'
})
export class ProjectSidebar implements OnChanges {
  @Input({ required: true }) projectId!: string;
  @Input() collapsed = false;
  @Input() showBrand = true;

  private readonly themeService = inject(ThemeService);
  private readonly projectService = inject(ProjectService);

  readonly iconSize = 20;
  readonly projectType = signal<ProjectType | null>(null);
  readonly isLoading = signal(true);
  readonly workspaceConfig = computed(() => getProjectWorkspaceConfig(this.projectType()));
  readonly workspaceProgress = computed(() => ({
    completed: getCompletedProjectSetupItems(PROJECT_SETUP_ITEMS),
    total: PROJECT_SETUP_ITEMS.length,
    nextStep: getProjectSetupNextStep(PROJECT_SETUP_ITEMS)
  }));
  readonly isWorkspaceComplete = computed(
    () => this.workspaceProgress().completed >= this.workspaceProgress().total
  );
  readonly workspaceTitle = computed(() => `${this.workspaceConfig().typeLabel} workspace`);
  readonly sections = computed<Array<SidebarSection & { items: ProjectSidebarItem[] }>>(() =>
    this.workspaceConfig().sections.map((section) => ({
      ...section,
      items: section.items.map((item) => ({
        ...item,
        route: item.path,
        hasDropdown: false,
      })),
    }))
  );

  readonly footerItems: ProjectSidebarItem[] = [
    {
      label: 'Back to projects',
      icon: 'arrow-left' as AppIconName,
      path: '__back__',
      route: '/app/projects',
      hasDropdown: false
    },
    {
      label: 'Editor',
      icon: 'pen',
      path: 'editor',
      route: 'editor',
      hasDropdown: false
    }
  ];

  ngOnChanges(changes: SimpleChanges): void {
    if ('projectId' in changes) {
      this.loadProjectType();
    }
  }

  logoSrc(): string {
    return this.themeService.resolvedTheme() === 'dark'
      ? 'assets/Logo/FormaLogoOnly-white.svg'
      : 'assets/Logo/FormaLogoOnly.svg';
  }

  trackSectionId(_: number, section: SidebarSection): string {
    return section.id;
  }

  trackItemLabel(_: number, item: SidebarItem): string {
    return item.label;
  }

  progressPercent(): number {
    return (this.workspaceProgress().completed / this.workspaceProgress().total) * 100;
  }

  projectBaseRoute(): string[] {
    return ['/app/projects', this.projectId];
  }

  projectRoute(path: string): string[] {
    return path ? ['/app/projects', this.projectId, path] : this.projectBaseRoute();
  }

  private loadProjectType(): void {
    const projectId = Number(this.projectId);

    if (!Number.isFinite(projectId) || projectId <= 0) {
      this.projectType.set(null);
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    this.projectService.getProjectById(projectId).subscribe({
      next: (project) => {
        this.projectType.set(project.type);
        this.isLoading.set(false);
      },
      error: () => {
        this.projectType.set(null);
        this.isLoading.set(false);
      },
    });
  }
}
