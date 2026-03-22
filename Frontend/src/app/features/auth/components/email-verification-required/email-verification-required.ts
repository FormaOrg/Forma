import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { NgIf } from '@angular/common';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-email-verification-required',
  standalone: true,
  templateUrl: './email-verification-required.html',
  imports: [NgIf, RouterModule]
})
export class EmailVerificationRequiredComponent implements OnInit {

  userEmail = '';
  returnUrl = '/dashboard';

  isResending = false;
  resendSuccess = '';
  resendError = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/dashboard';

    const user = this.authService.currentUserValue;
    this.userEmail = user?.email
      ?? localStorage.getItem('pendingVerificationEmail')
      ?? '';

    // Already verified — redirect immediately
    if (user?.emailVerified) {
      this.router.navigate([this.returnUrl]);
    }
  }

  // HTML uses: resendVerification()
  resendVerification(): void {
    if (!this.userEmail) {
      this.resendError = 'No email address found. Please log in again.';
      return;
    }

    this.isResending = true;
    this.resendSuccess = '';
    this.resendError = '';

    this.authService.resendVerificationEmail(this.userEmail).subscribe({
      next: (response: { message: string }) => {
        this.isResending = false;
        this.resendSuccess = response.message || 'Verification email sent! Check your inbox.';
      },
      error: (err: { error?: { message?: string } }) => {
        this.isResending = false;
        this.resendError = err.error?.message ?? 'Failed to resend. Please try again.';
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }
}