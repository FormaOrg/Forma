import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { GoogleAuthPopupService } from '../../../../core/services/google-auth-popup.service';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.html',
  imports: [FormsModule, NgIf, RouterModule]
})
export class LoginComponent implements OnInit {
  email        = '';
  password     = '';
  rememberMe   = false;
  showPassword = false;
  registerQueryParams: Record<string, string> = {};

  private returnUrl = '/app/home';

  error            = '';
  emailNotVerified = false;
  isResending      = false;
  resendSuccess    = '';
  resendError      = '';
  isGoogleLoading  = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private toastService: ToastService,
    private googleAuthPopupService: GoogleAuthPopupService
  ) {}

  ngOnInit(): void {
    this.returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/app/home';
    this.email = this.route.snapshot.queryParamMap.get('email') ?? '';
    this.registerQueryParams = {
      returnUrl: this.returnUrl,
      ...(this.email ? { email: this.email } : {})
    };
  }

  onSubmit(event: Event): void {
    this.authService.clearPendingLoginVerification();
    this.error            = '';
    this.emailNotVerified = false;
    this.resendSuccess    = '';
    this.resendError      = '';

    this.authService.login({
      email: this.email,
      password: this.password,
      rememberMe: this.rememberMe
    }).subscribe({
      next: (response) => {
        if (response.requiresLoginVerification && response.loginVerificationToken) {
          this.authService.savePendingLoginVerification({
            token: response.loginVerificationToken,
            email: this.email,
            message: response.message,
            rememberMe: this.rememberMe,
            returnUrl: this.returnUrl
          });
          this.password = '';
          this.router.navigate(['/login-verification'], {
            queryParams: { returnUrl: this.returnUrl }
          });
          return;
        }

        this.router.navigateByUrl(this.returnUrl);
      },
      error: (err) => {
        if (err?.status === 0) {
          this.toastService.error('We can’t reach the server right now. Check your internet connection and try again.');
          return;
        }

        const msg: string =
          err?.error?.message ?? err?.message ?? 'Login failed. Please try again.';

        if (
          msg.toLowerCase().includes('verify your email') ||
          (msg.toLowerCase().includes('email') && msg.toLowerCase().includes('verif'))
        ) {
          this.emailNotVerified = true;
          localStorage.setItem('pendingVerificationEmail', this.email);
          this.toastService.info(msg);
        } else {
          this.toastService.error(msg);
        }
      }
    });
  }

  resendVerification(): void {
    this.isResending   = true;
    this.resendSuccess = '';
    this.resendError   = '';

    this.authService.resendVerificationEmail(this.email).subscribe({
      next: (res: { message: string }) => {
        this.isResending   = false;
        this.toastService.info(res.message || 'Verification email sent! Check your inbox.');
      },
      error: (err) => {
        this.isResending = false;
        if (err?.status === 0) {
          this.toastService.error('We can’t reach the server right now. Check your internet connection and try again.');
          return;
        }
        this.resendError = err?.error?.message ?? 'Failed to resend. Please try again.';
        this.toastService.error(this.resendError);
      }
    });
  }

  async loginWithGoogle(): Promise<void> {
    if (this.isGoogleLoading) {
      return;
    }

    this.authService.clearPendingLoginVerification();
    this.error            = '';
    this.emailNotVerified = false;
    this.resendSuccess    = '';
    this.resendError      = '';
    this.isGoogleLoading  = true;

    try {
      const response = await this.googleAuthPopupService.start(this.rememberMe, this.returnUrl);
      this.isGoogleLoading = false;

      if (response.requiresLoginVerification && response.loginVerificationToken) {
        this.authService.savePendingLoginVerification({
          token: response.loginVerificationToken,
          email: response.user.email,
          message: response.message,
          rememberMe: this.rememberMe,
          returnUrl: this.returnUrl
        });
        await this.router.navigate(['/login-verification'], {
          queryParams: { returnUrl: this.returnUrl }
        });
        return;
      }

      await this.router.navigateByUrl(this.returnUrl);
    } catch (error: any) {
      this.isGoogleLoading = false;
      const message = error?.message ?? 'Google sign-in failed. Please try again.';
      this.toastService.error(message);
    }
  }
}
