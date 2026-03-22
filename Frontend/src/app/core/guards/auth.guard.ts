// src/app/core/guards/auth.guard.ts
import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router
} from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {

    // 1. Not logged in → send to login, preserve returnUrl
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: state.url }
      });
      return false;
    }

    const user = this.authService.currentUserValue;

    // 2. Logged in but email not verified → send to verify-email-required
    if (user && !user.emailVerified) {
      this.router.navigate(['/verify-email-required'], {
        queryParams: { returnUrl: state.url }
      });
      return false;
    }

    // 3. All good
    return true;
  }
}