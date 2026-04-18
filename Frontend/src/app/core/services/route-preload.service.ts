import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class RoutePreloadService {
  private dashboardPreloadStarted = false;
  private projectWorkspacePreloadStarted = false;

  preloadDashboardRoutes(): void {
    if (this.dashboardPreloadStarted) {
      return;
    }

    this.dashboardPreloadStarted = true;
    this.schedule(() => {
      void Promise.allSettled([
        import('../../features/app/dashboard/pages/home/home'),
        import('../../features/app/dashboard/pages/projects/projects-route-layout/projects-route-layout'),
        import('../../features/app/dashboard/pages/projects/projects'),
        import('../../features/app/dashboard/pages/templates/templates'),
        import('../../features/app/dashboard/pages/billing/billing'),
        import('../../features/app/dashboard/pages/settings/settings'),
        import('../../features/app/dashboard/pages/settings/pages/profile/profile'),
        import('../../features/app/dashboard/pages/settings/pages/security/security'),
        import('../../features/app/dashboard/pages/settings/pages/preferences/preferences'),
        import('../../features/app/dashboard/pages/settings/pages/activity/activity')
      ]);
    });
  }

  preloadProjectWorkspaceRoutes(): void {
    if (this.projectWorkspacePreloadStarted) {
      return;
    }

    this.projectWorkspacePreloadStarted = true;
    this.schedule(() => {
      void Promise.allSettled([
        import('../../features/app/dashboard/pages/projects/project-workspace-layout/project-workspace-layout'),
        import('../../features/app/dashboard/pages/projects/project-route-placeholder/project-route-placeholder'),
        import('../../features/app/dashboard/pages/projects/project-home-route/project-home-route'),
        import('../../features/app/dashboard/pages/projects/project-sales-route/project-sales-route'),
        import('../../features/app/dashboard/pages/projects/project-catalog-route/project-catalog-route'),
        import('../../features/app/dashboard/pages/projects/project-customers-route/project-customers-route'),
        import('../../features/app/dashboard/pages/projects/project-pages-route/project-pages-route'),
        import('../../features/app/dashboard/pages/projects/project-analytics-route/project-analytics-route'),
        import('../../features/app/dashboard/pages/projects/project-settings-route/project-settings-route')
      ]);
    });
  }

  private schedule(task: () => void): void {
    const connection = this.readConnection();
    if (connection?.saveData) {
      return;
    }

    const requestIdle = this.readRequestIdleCallback();
    if (requestIdle) {
      requestIdle(() => task(), { timeout: 1500 });
      return;
    }

    window.setTimeout(task, 250);
  }

  private readRequestIdleCallback():
    | ((callback: IdleRequestCallback, options?: IdleRequestOptions) => number)
    | null {
    return 'requestIdleCallback' in window
      ? window.requestIdleCallback.bind(window)
      : null;
  }

  private readConnection(): { saveData?: boolean } | null {
    const navigatorWithConnection = navigator as Navigator & {
      connection?: { saveData?: boolean };
    };
    return navigatorWithConnection.connection ?? null;
  }
}
