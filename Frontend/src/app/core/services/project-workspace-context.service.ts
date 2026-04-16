import { Injectable, signal } from '@angular/core';
import { ProjectType } from '../models/project.model';

@Injectable({ providedIn: 'root' })
export class ProjectWorkspaceContextService {
  private readonly storageKey = 'forma_project_workspace_types';
  private readonly projectTypes = signal<Record<number, ProjectType>>({});

  constructor() {
    this.projectTypes.set(this.loadStoredProjectTypes());
  }

  getProjectType(projectId: number | string | null | undefined): ProjectType | null {
    const parsed = Number(projectId);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return null;
    }

    return this.projectTypes()[parsed] ?? null;
  }

  setProjectType(projectId: number, type: ProjectType): void {
    this.projectTypes.update((current) => {
      const next = {
        ...current,
        [projectId]: type,
      };
      this.storeProjectTypes(next);
      return next;
    });
  }

  private loadStoredProjectTypes(): Record<number, ProjectType> {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) {
        return {};
      }

      return JSON.parse(raw) as Record<number, ProjectType>;
    } catch {
      return {};
    }
  }

  private storeProjectTypes(types: Record<number, ProjectType>): void {
    localStorage.setItem(this.storageKey, JSON.stringify(types));
  }
}
