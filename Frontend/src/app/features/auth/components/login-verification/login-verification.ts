import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-login-verification',
  standalone: true,
  templateUrl: './login-verification.html',
  styleUrl: './login-verification.css',
  imports: [CommonModule, FormsModule, RouterModule]
})
export class LoginVerificationComponent implements OnInit {
  code = '';
  email = '';
  message = 'Enter the 6-digit code we sent to your email to finish signing in.';
  isVerifying = false;
  isResending = false;
  private verificationToken = '';
  private rememberMe = false;
  private returnUrl = '/app/home';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    const pending = this.authService.getPendingLoginVerification();
    this.returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? pending?.returnUrl ?? '/app/home';

    if (!pending?.token) {
      this.toastService.error('Your verification session has expired. Please sign in again.');
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.returnUrl } });
      return;
    }

    this.verificationToken = pending.token;
    this.email = pending.email;
    this.message = pending.message || this.message;
    this.rememberMe = !!pending.rememberMe;
  }

  confirmCode(): void {
    if (this.code.trim().length !== 6 || !this.verificationToken) {
      return;
    }

    this.isVerifying = true;
    this.authService.verifyLoginCode(
      { token: this.verificationToken, code: this.code.trim() },
      this.rememberMe
    ).subscribe({
      next: () => {
        this.isVerifying = false;
        this.authService.clearPendingLoginVerification();
        this.toastService.success('Verification complete. Redirecting...');
        this.router.navigateByUrl(this.returnUrl);
      },
      error: (err) => {
        this.isVerifying = false;
        if (err?.status === 0) {
          this.toastService.error('We can’t reach the server right now. Check your internet connection and try again.');
          return;
        }
        this.toastService.error(err?.error?.message ?? 'That code was not accepted. Please try again.');
      }
    });
  }

  resendCode(): void {
    if (!this.verificationToken) {
      return;
    }

    this.isResending = true;
    this.authService.resendLoginCode(this.verificationToken).subscribe({
      next: (res) => {
        this.isResending = false;
        this.toastService.info(res.message || 'A new verification code has been sent.');
      },
      error: (err) => {
        this.isResending = false;
        if (err?.status === 0) {
          this.toastService.error('We can’t reach the server right now. Check your internet connection and try again.');
          return;
        }
        this.toastService.error(err?.error?.message ?? 'Failed to resend the verification code.');
      }
    });
  }

  useAnotherAccount(): void {
    this.authService.clearPendingLoginVerification();
    this.router.navigate(['/login'], { queryParams: { returnUrl: this.returnUrl } });
  }
}
