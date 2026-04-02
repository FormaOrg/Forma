import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  DetachedRouteHandle,
  RouteReuseStrategy
} from '@angular/router';

@Injectable()
export class SettingsRouteReuseStrategy implements RouteReuseStrategy {
  private readonly cachedHandles = new Map<string, DetachedRouteHandle>();
  private readonly cacheablePaths = new Set([
    'app/settings/profile',
    'app/settings/security',
    'app/settings/preferences',
    'app/settings/activity'
  ]);

  shouldDetach(route: ActivatedRouteSnapshot): boolean {
    return this.isCacheable(route);
  }

  store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle | null): void {
    const routeKey = this.getRouteKey(route);
    if (!routeKey) {
      return;
    }

    if (handle) {
      this.cachedHandles.set(routeKey, handle);
    } else {
      this.cachedHandles.delete(routeKey);
    }
  }

  shouldAttach(route: ActivatedRouteSnapshot): boolean {
    const routeKey = this.getRouteKey(route);
    return !!routeKey && this.cachedHandles.has(routeKey);
  }

  retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null {
    const routeKey = this.getRouteKey(route);
    return routeKey ? this.cachedHandles.get(routeKey) ?? null : null;
  }

  shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
    return future.routeConfig === curr.routeConfig;
  }

  private isCacheable(route: ActivatedRouteSnapshot): boolean {
    const routeKey = this.getRouteKey(route);
    return !!routeKey && this.cacheablePaths.has(routeKey);
  }

  private getRouteKey(route: ActivatedRouteSnapshot): string | null {
    const segments = route.pathFromRoot
      .map(snapshot => snapshot.routeConfig?.path)
      .filter((segment): segment is string => !!segment && segment !== '**');

    if (!segments.length) {
      return null;
    }

    return segments.join('/');
  }
}
