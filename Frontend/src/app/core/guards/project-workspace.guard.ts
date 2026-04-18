import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivateChild,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ProjectService } from '../services/project.service';
import { ProjectWorkspaceContextService } from '../services/project-workspace-context.service';
import {
  getProjectWorkspaceAllowedPaths,
  getProjectWorkspaceDefaultPath,
} from '../../shared/app/project-workspace/project-workspace.config';

@Injectable({ providedIn: 'root' })
export class ProjectWorkspaceGuard implements CanActivateChild {
  constructor(
    private readonly projectService: ProjectService,
    private readonly projectWorkspaceContextService: ProjectWorkspaceContextService,
    private readonly router: Router
  ) {}

  canActivateChild(
    route: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> {
    const projectId = this.readProjectId(route);
    const requestedPath = route.routeConfig?.path ?? '';

    if (!projectId) {
      return of(this.router.createUrlTree(['/app/projects']));
    }

    const cachedType = this.projectWorkspaceContextService.getProjectType(projectId);
    if (cachedType) {
      const allowedPaths = getProjectWorkspaceAllowedPaths(cachedType);

      if (allowedPaths.includes(requestedPath)) {
        return of(true);
      }

      return of(this.router.createUrlTree([
        '/app/projects',
        projectId,
        getProjectWorkspaceDefaultPath(cachedType),
      ]));
    }

    return this.projectService.getProjectById(projectId).pipe(
      map((project) => {
        this.projectWorkspaceContextService.setProjectType(projectId, project.type);

        const allowedPaths = getProjectWorkspaceAllowedPaths(project.type);

        if (allowedPaths.includes(requestedPath)) {
          return true;
        }

        return this.router.createUrlTree([
          '/app/projects',
          projectId,
          getProjectWorkspaceDefaultPath(project.type),
        ]);
      }),
      catchError(() =>
        this.projectService.getMyPendingInvitation(projectId).pipe(
          map((invitation) => {
            if (invitation?.invitationToken) {
              return this.router.createUrlTree(['/accept-invitation'], {
                queryParams: { token: invitation.invitationToken, email: invitation.inviteEmail },
              });
            }
            const requestedSuffix = requestedPath ? `/${requestedPath}` : '';
            return this.router.createUrlTree(['/not-found'], {
              queryParams: { from: `/app/projects/${projectId}${requestedSuffix}` },
            });
          })
        )
      )
    );
  }

  private readProjectId(route: ActivatedRouteSnapshot): number {
    let current: ActivatedRouteSnapshot | null = route;

    while (current) {
      const value = current.paramMap.get('projectId');
      if (value) {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
      }

      current = current.parent;
    }

    return 0;
  }
}
