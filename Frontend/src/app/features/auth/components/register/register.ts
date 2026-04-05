import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { NgClass, NgIf } from '@angular/common';
import { AuthService } from '../../../../core/services/auth.service';
import { RegisterRequest, AuthResponse } from '../../../../core/models/user.model';
import { GoogleAuthPopupService } from '../../../../core/services/google-auth-popup.service';

interface RegisterModel {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

@Component({
  selector: 'app-register',
  standalone: true,
  templateUrl: './register.html',
  imports: [NgIf, FormsModule, NgClass, RouterModule]
})
export class RegisterComponent implements OnInit {
  model: RegisterModel = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  };

  showPassword = false;
  showConfirmPassword = false;
  agreeTerms = false;
  isLoading = false;
  isGoogleLoading = false;
  error = '';
  successMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private googleAuthPopupService: GoogleAuthPopupService
  ) {}

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
    }
  }

  getPasswordStrength(): 'weak' | 'medium' | 'strong' {
    const pwd = this.model.password;
    if (pwd.length < 6) return 'weak';

    const hasUpper   = /[A-Z]/.test(pwd);
    const hasLower   = /[a-z]/.test(pwd);
    const hasNumber  = /\d/.test(pwd);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);

    if (hasUpper && hasLower && hasNumber && hasSpecial) return 'strong';
    return 'medium';
  }

  checkPasswordMismatch(): boolean {
    return this.model.password !== this.model.confirmPassword
      && this.model.confirmPassword.length > 0;
  }

  onSubmit(form: NgForm): void {
    if (form.invalid) {
      this.error = 'Please fill in all required fields correctly';
      return;
    }
    if (this.checkPasswordMismatch()) {
      this.error = 'Passwords do not match';
      return;
    }
    if (!this.agreeTerms) {
      this.error = 'You must accept the terms to continue';
      return;
    }

    this.error = '';
    this.isLoading = true;

    const registerData: RegisterRequest = {
      firstName: this.model.firstName,
      lastName:  this.model.lastName,
      email:     this.model.email,
      password:  this.model.password,
      phone:     this.model.phone || undefined
    };

    this.authService.register(registerData).subscribe({
      next: (response: AuthResponse) => {
        this.isLoading = false;
        console.log('✅ Registered:', response.user.email);
        this.successMessage = 'Account created successfully! Redirecting to login...';

        setTimeout(() => {
          this.router.navigate(['/login'], {
            queryParams: { registered: 'true', email: this.model.email }
          });
        }, 3000);
      },
      error: (err: { status: number; error?: { message?: string; errors?: Record<string, string> } }) => {
        this.isLoading = false;
        console.error('❌ Registration error:', err);

        if (err.status === 409) {
          this.error = 'An account with this email already exists.';
        } else if (err.status === 400) {
          this.error = err.error?.message
            ?? Object.values(err.error?.errors ?? {}).join(', ')
            ?? 'Invalid registration data.';
        } else if (err.status === 0) {
          this.error = 'Cannot connect to server. Please check your connection.';
        } else {
          this.error = err.error?.message ?? 'Registration failed. Please try again.';
        }
      }
    });
  }

  async signupWithGoogle(): Promise<void> {
    if (this.isGoogleLoading) {
      return;
    }

    this.error = '';
    this.isGoogleLoading = true;

    try {
      const response = await this.googleAuthPopupService.start(true, '/app/home');
      this.isGoogleLoading = false;

      if (response.requiresLoginVerification && response.loginVerificationToken) {
        this.authService.savePendingLoginVerification({
          token: response.loginVerificationToken,
          email: response.user.email,
          message: response.message,
          rememberMe: true,
          returnUrl: '/app/home'
        });
        await this.router.navigate(['/login-verification']);
        return;
      }

      await this.router.navigate(['/app/home']);
    } catch (error: any) {
      this.isGoogleLoading = false;
      this.error = error?.message ?? 'Google sign-up failed. Please try again.';
    }
  }
}
