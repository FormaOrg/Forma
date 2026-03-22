// login.component.ts
import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
  imports: [FormsModule, NgIf, RouterModule]
})
export class LoginComponent implements OnInit {

  email        = '';
  password     = '';
  rememberMe   = false;
  showPassword = false;

  private returnUrl = '/home';

  error            = '';
  emailNotVerified = false;
  isResending      = false;
  resendSuccess    = '';
  resendError      = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/home';
  }

  onSubmit(event: Event): void {
    this.error            = '';
    this.emailNotVerified = false;
    this.resendSuccess    = '';
    this.resendError      = '';

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: () => {
        this.router.navigateByUrl(this.returnUrl);
      },
      error: (err) => {
        const msg: string =
          err?.error?.message ?? err?.message ?? 'Login failed. Please try again.';

        if (
          msg.toLowerCase().includes('verify your email') ||
          (msg.toLowerCase().includes('email') && msg.toLowerCase().includes('verif'))
        ) {
          this.emailNotVerified = true;
          localStorage.setItem('pendingVerificationEmail', this.email);
        } else {
          this.error = msg;
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
        this.resendSuccess = res.message || 'Verification email sent! Check your inbox.';
      },
      error: (err) => {
        this.isResending = false;
        this.resendError = err?.error?.message ?? 'Failed to resend. Please try again.';
      }
    });
  }
}