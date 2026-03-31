// src/app/core/guards/auth.guard.ts
import { Injectable } from '@angular/core';
import {
  CanActivate,
  CanActivateChild,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
  UrlTree
} from '@angular/router';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate, CanActivateChild {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> {
    return this.checkAccess(state.url);
  }

  canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> {
    return this.checkAccess(state.url);
  }

  private checkAccess(returnUrl: string): Observable<boolean | UrlTree> {
    if (!this.authService.isLoggedIn()) {
      return of(this.router.createUrlTree(['/login'], {
        queryParams: { returnUrl }
      }));
    }

    const user = this.authService.currentUserValue;

    if (user && !user.emailVerified) {
      return of(this.router.createUrlTree(['/verify-email-required'], {
        queryParams: { returnUrl }
      }));
    }

    return this.authService.validateCurrentSession().pipe(
      map((isValid) => isValid
        ? true
        : this.router.createUrlTree(['/login'], { queryParams: { returnUrl } }))
    );
  }
}
