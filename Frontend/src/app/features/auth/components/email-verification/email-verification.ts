import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { NgIf } from '@angular/common';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-email-verification',
  standalone: true,
  templateUrl: './email-verification.html',
  imports: [NgIf, RouterModule]
})
export class EmailVerificationComponent implements OnInit {

  // HTML uses: loading, success, message, canResend
  loading = true;
  success = false;
  message = '';
  canResend = false;

  // For resend flow
  isResending = false;
  resendSuccess = '';
  resendError = '';

  private userEmail = '';
  private returnUrl = '/app/home';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.userEmail = localStorage.getItem('pendingVerificationEmail') ?? '';
    this.returnUrl = localStorage.getItem('pendingVerificationReturnUrl') ?? '/app/home';

    const token = this.route.snapshot.queryParamMap.get('token');

    if (!token) {
      this.loading = false;
      this.success = false;
      this.message = 'Invalid verification link. No token found.';
      this.canResend = true;
      return;
    }

    this.authService.verifyEmail(token).subscribe({
      next: (response: { message: string }) => {
        this.loading = false;
        this.success = true;
        this.message = response.message || 'Email verified successfully!';
        this.canResend = false;
        localStorage.removeItem('pendingVerificationEmail');
        localStorage.removeItem('pendingVerificationReturnUrl');

        setTimeout(() => this.router.navigate(['/login'], {
          queryParams: {
            returnUrl: this.returnUrl,
            ...(this.userEmail ? { email: this.userEmail } : {})
          }
        }), 3000);
      },
      error: (err: { status: number; error?: { message?: string } }) => {
        this.loading = false;
        this.success = false;
        this.canResend = true;

        if (err.status === 409) {
          this.success = true; // already verified — treat as success
          this.message = 'Your email is already verified.';
          this.canResend = false;
          setTimeout(() => this.router.navigate(['/login'], {
            queryParams: {
              returnUrl: this.returnUrl,
              ...(this.userEmail ? { email: this.userEmail } : {})
            }
          }), 2000);
        } else if (err.status === 400) {
          this.message = 'This verification link has expired or is invalid.';
        } else {
          this.message = err.error?.message ?? 'Verification failed. Please try again.';
        }
      }
    });
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

  // HTML uses: goToLogin(), goToRegister()
  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  goToRegister(): void {
    this.router.navigate(['/register']);
  }
}
