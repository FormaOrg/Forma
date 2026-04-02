import { CommonModule } from '@angular/common';
import { Component, Input, computed, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AppIcon, AppIconName } from '../icons/app-icon';
import { ThemeService } from '../../../core/services/theme.service';
import type { SidebarItem, SidebarSection } from '../dashboard-nav.types';
import {
  getCompletedProjectSetupItems,
  getProjectSetupNextStep,
  PROJECT_SETUP_ITEMS
} from '../project-setup/project-setup.data';

type ProjectSidebarItem = SidebarItem & { path: string };

@Component({
  selector: 'app-project-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, AppIcon],
  templateUrl: './project-sidebar.html',
  styleUrl: './project-sidebar.css'
})
export class ProjectSidebar {
  @Input({ required: true }) projectId!: string;
  @Input() collapsed = false;
  @Input() showBrand = true;

  private readonly themeService = inject(ThemeService);

  readonly iconSize = 20;
  readonly workspaceProgress = computed(() => ({
    completed: getCompletedProjectSetupItems(PROJECT_SETUP_ITEMS),
    total: PROJECT_SETUP_ITEMS.length,
    nextStep: getProjectSetupNextStep(PROJECT_SETUP_ITEMS)
  }));
  readonly isWorkspaceComplete = computed(
    () => this.workspaceProgress().completed >= this.workspaceProgress().total
  );

  readonly sections: Array<SidebarSection & { items: ProjectSidebarItem[] }> = [
    {
      id: 'setup',
      label: 'Setup',
      items: [
        { label: 'Setup', icon: 'rocket', path: '', route: '', hasDropdown: false }
      ]
    },
    {
      id: 'workspace',
      label: 'Workspace',
      items: [
        { label: 'Home', icon: 'home', path: 'overview', route: 'overview', hasDropdown: false },
        { label: 'Sales', icon: 'dollar-sign', path: 'deploy', route: 'deploy', hasDropdown: false },
        { label: 'Catalog', icon: 'package', path: 'pages', route: 'pages', hasDropdown: false }
      ]
    },
    {
      id: 'audience',
      label: 'Audience',
      items: [
        { label: 'Customers', icon: 'users', path: 'media', route: 'media', hasDropdown: false },
        { label: 'Analytics', icon: 'bar-chart', path: 'preview', route: 'preview', hasDropdown: false }
      ]
    },
    {
      id: 'support',
      label: 'Support',
      items: [
        { label: 'Help', icon: 'help-circle', path: 'media', route: 'media', hasDropdown: false },
        { label: 'Settings', icon: 'settings', path: 'settings', route: 'settings', hasDropdown: false }
      ]
    }
  ];

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
}
