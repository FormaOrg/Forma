import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { NgClass, NgIf } from '@angular/common';
import { AuthService } from '../../../../core/services/auth.service';
import { RegisterRequest, AuthResponse } from '../../../../core/models/user.model';

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
  styleUrls: ['./register.css'],
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
  error = '';
  successMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router
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

  // Social login — stubbed for MVP
  signupWithGoogle():   void { this.error = 'Social signup coming soon!'; }
  signupWithGithub():   void { this.error = 'Social signup coming soon!'; }
  signupWithFacebook(): void { this.error = 'Social signup coming soon!'; }
  signupWithLinkedIn(): void { this.error = 'Social signup coming soon!'; }
}