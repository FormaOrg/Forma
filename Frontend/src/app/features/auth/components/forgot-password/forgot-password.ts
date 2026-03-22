import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  templateUrl: './forgot-password.html',
  styleUrls: ['./forgot-password.scss'],
  imports: [FormsModule, RouterModule, CommonModule]
})
export class ForgotPasswordComponent {
  email: string = '';
  error: string = '';
  success: string = '';
  isLoading: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  onSubmit(form: NgForm): void {
    if (form.invalid) {
      this.error = 'Please enter a valid email address';
      return;
    }

    this.error = '';
    this.success = '';
    this.isLoading = true;

    console.log('📤 Requesting password reset for:', this.email);

    this.authService.forgotPassword(this.email).subscribe({
      next: (response) => {
        console.log('✅ Password reset email sent:', response);
        this.success = response.message || 'Password reset instructions have been sent to your email';
        this.isLoading = false;
        

        form.reset();
        

        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000);
      },
      error: (err) => {
        console.error('❌ Password reset error:', err);
        this.isLoading = false;
        
        if (err.status === 404) {
          this.error = 'No account found with this email address';
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
}