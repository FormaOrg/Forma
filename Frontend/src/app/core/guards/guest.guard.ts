// src/app/core/guards/guest.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class GuestGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {

    // Already logged in with verified email → go home
    if (this.authService.isLoggedIn()) {
      const user = this.authService.currentUserValue;

      if (user && !user.emailVerified) {
        // Logged in but unverified → let them see verify-email-required, not login
        this.router.navigate(['/verify-email-required']);
        return false;
      }

      this.router.navigate(['/home']);
      return false;
    }

    // Not logged in → allow access to login/register
    return true;
  }
}