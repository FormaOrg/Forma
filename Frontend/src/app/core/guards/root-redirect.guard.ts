import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class RootRedirectGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean {
    if (!this.authService.isLoggedIn()) return true;

    const user = this.authService.currentUserValue;
    if (user && !user.emailVerified) {
      this.router.navigate(['/verify-email-required']);
      return false;
    }

    this.router.navigate(['/app/home']);
    return false;
  }
}

