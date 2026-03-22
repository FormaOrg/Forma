import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  templateUrl: './reset-password.html',
  styleUrls: ['./reset-password.scss'],
  imports: [FormsModule, RouterModule, NgIf]
})
export class ResetPasswordComponent implements OnInit {
  token: string = '';
  newPassword: string = '';
  confirmPassword: string = '';
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;
  error: string = '';
  success: string = '';
  isLoading: boolean = false;
  tokenValid: boolean = true;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {

    this.route.queryParams.subscribe(params => {
      this.token = params['token'];
      
      if (!this.token) {
        this.tokenValid = false;
        this.error = 'Invalid or missing reset token';
      } else {
        console.log('Reset token received:', this.token.substring(0, 20) + '...');
      }
    });
  }

  onSubmit(form: NgForm): void {
    if (form.invalid) {
      this.error = 'Please fill in all required fields correctly';
      return;
    }


    if (this.newPassword !== this.confirmPassword) {
      this.error = 'Passwords do not match';
      return;
    }


    if (this.newPassword.length < 6) {
      this.error = 'Password must be at least 6 characters long';
      return;
    }

    this.error = '';
    this.success = '';
    this.isLoading = true;

    console.log('📤 Resetting password with token:', this.token.substring(0, 20) + '...');

    this.authService.resetPassword(this.token, this.newPassword).subscribe({
      next: (response) => {
        console.log('✅ Password reset successful:', response);
        this.success = response.message || 'Password reset successful!';
        this.isLoading = false;
        

        form.reset();
        

        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000);
      },
      error: (err) => {
        console.error('❌ Password reset error:', err);
        this.isLoading = false;
        
        if (err.status === 400) {
          this.error = err.error?.message || 'Invalid or expired reset token';
        } else if (err.status === 0) {
          this.error = 'Cannot connect to server. Please check your internet connection.';
        } else if (err.error && err.error.message) {
          this.error = err.error.message;
        } else {
          this.error = 'An error occurred. Please try again.';
        }
      }
    });
  }

  getPasswordStrength(): string {
    if (!this.newPassword) return '';
    
    const length = this.newPassword.length;
    const hasUpperCase = /[A-Z]/.test(this.newPassword);
    const hasLowerCase = /[a-z]/.test(this.newPassword);
    const hasNumbers = /\d/.test(this.newPassword);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(this.newPassword);
    
    let strength = 0;
    if (length >= 6) strength++;
    if (length >= 8) strength++;
    if (hasUpperCase && hasLowerCase) strength++;
    if (hasNumbers) strength++;
    if (hasSpecialChar) strength++;
    
    if (strength <= 2) return 'weak';
    if (strength <= 3) return 'medium';
    return 'strong';
  }


  hasMinLength(): boolean {
    return this.newPassword.length >= 6;
  }

  hasUpperAndLowerCase(): boolean {
    return /[A-Z]/.test(this.newPassword) && /[a-z]/.test(this.newPassword);
  }

  hasNumber(): boolean {
    return /\d/.test(this.newPassword);
  }

  hasSpecialChar(): boolean {
    return /[!@#$%^&*(),.?":{}|<>]/.test(this.newPassword);
  }
}