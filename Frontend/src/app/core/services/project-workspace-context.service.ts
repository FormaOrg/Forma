import { Injectable, signal } from '@angular/core';
import { ProjectType } from '../models/project.model';

@Injectable({ providedIn: 'root' })
export class ProjectWorkspaceContextService {
  private readonly projectTypes = signal<Record<number, ProjectType>>({});

  getProjectType(projectId: number | string | null | undefined): ProjectType | null {
    const parsed = Number(projectId);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return null;
    }

    return this.projectTypes()[parsed] ?? null;
  }

  setProjectType(projectId: number, type: ProjectType): void {
    this.projectTypes.update((current) => ({
      ...current,
      [projectId]: type,
    }));
  }
}
