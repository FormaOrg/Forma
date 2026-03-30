import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-settings-security',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './security.html',
  styleUrl: './security.css'
})
export class SettingsSecurity implements OnInit {
            identityConfirmed = false;
            pendingAction: 'questions' | 'recovery' | null = null;
          showVerifyQuestionsModal = false;
          verifyQuestionsPassword = '';
          verifyQuestionsError = '';
        // Only check security questions/answers validity for Save Questions button
        get securityQuestionsValid(): boolean {
          if (!this.securityForm) return false;
          const q1 = this.securityForm.get('question1');
          const a1 = this.securityForm.get('answer1');
          const q2 = this.securityForm.get('question2');
          const a2 = this.securityForm.get('answer2');
          return !!(q1 && a1 && q2 && a2 && q1.valid && a1.valid && q2.valid && a2.valid);
        }

        get recoveryOptionsValid(): boolean {
          if (!this.securityForm) return false;
          const email = this.securityForm.get('recoveryEmail');
          const phone = this.securityForm.get('recoveryPhone');
          const emailValue = email?.value?.trim();
          const phoneValue = phone?.value?.trim();
          // If both are empty, invalid
          if (!emailValue && !phoneValue) return false;
          // If email is non-empty, must be valid
          if (emailValue && !email?.valid) return false;
          // If phone is non-empty, must be valid
          if (phoneValue && !phone?.valid) return false;
          // At least one is non-empty and valid
          return true;
        }
      securityQuestions: string[] = [
        'What was your childhood nickname?',
        'In what city did you meet your spouse/significant other?',
        'What is the name of your favorite childhood friend?',
        'What street did you live on in third grade?',
        'What is your oldest sibling’s birthday month and year?',
        'What is the middle name of your youngest child?',
        'What is your oldest sibling’s middle name?',
        'What school did you attend for sixth grade?',
        'What was your childhood phone number?',
        'What is your maternal grandmother’s maiden name?'
      ];

      get filteredQuestions1(): string[] {
        const q2 = this.securityForm?.get('question2')?.value;
        return this.securityQuestions.filter(q => q !== q2);
      }
      get filteredQuestions2(): string[] {
        const q1 = this.securityForm?.get('question1')?.value;
        return this.securityQuestions.filter(q => q !== q1);
      }
    showCurrentPassword = false;
    showNewPassword = false;
    showConfirmPassword = false;
  private fb = inject(FormBuilder);
  private router = inject(Router);

  securityForm!: FormGroup;
  isSavingPassword = false;
  isSavingQuestions = false;
  isSavingRecovery = false;
  is2FAEnabled = false;
  showVerifyEmailModal = false;
  userEmail = 'iskanderboughnimi@gmail.com'; // TODO: Replace with actual user email from profile/account service

  ngOnInit(): void {
    this.securityForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
      question1: ['', Validators.required],
      answer1: ['', Validators.required],
      question2: ['', Validators.required],
      answer2: ['', Validators.required],
      recoveryEmail: ['', [Validators.email]],
      recoveryPhone: ['', [Validators.pattern(/^[0-9\-\+\(\)\s]*$/)]]
    }, { validators: this.passwordsMatchValidator });
  }

  private passwordsMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { passwordsMismatch: true };
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.securityForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string | null {
    const field = this.securityForm.get(fieldName);
    if (field?.hasError('required')) return 'This field is required';
    if (field?.hasError('minlength')) return `Minimum ${field.getError('minlength').requiredLength} characters`;
    if (field?.hasError('pattern')) return 'Invalid format';
    if (field?.hasError('email')) return 'Invalid email';
    if (fieldName === 'confirmPassword' && this.securityForm.hasError('passwordsMismatch')) return 'Passwords do not match';
    return null;
  }

  onChangePassword(): void {
    if (this.securityForm.invalid) return;
    this.isSavingPassword = true;
    setTimeout(() => {
      this.isSavingPassword = false;
      // Simulate password change
    }, 1200);
  }


  openVerifyEmailModal(): void {
    this.showVerifyEmailModal = true;
  }

  closeVerifyEmailModal(): void {
    this.showVerifyEmailModal = false;
  }

  sendVerifyEmailCode(): void {
    // Here you would trigger sending the code and then show the next step/modal if needed
    this.is2FAEnabled = true;
    this.closeVerifyEmailModal();
    // Optionally show a toast or next modal for code entry
  }

  goToChangeEmail(event: Event): void {
    event.preventDefault();
    // Use Angular Router to navigate to profile page and open change email modal
    this.router.navigate(['/app/settings/profile'], { queryParams: { changeEmail: 1 } });
  }

  onSaveSecurityQuestions(): void {
    if (this.identityConfirmed) {
      this.isSavingQuestions = true;
      setTimeout(() => {
        this.isSavingQuestions = false;
        // Simulate save
      }, 1200);
      return;
    }
    this.pendingAction = 'questions';
    this.verifyQuestionsPassword = '';
    this.verifyQuestionsError = '';
    this.showVerifyQuestionsModal = true;
  }

  confirmVerifyQuestionsPassword(): void {
    // Simulate password check (replace with real check in production)
    const correctPassword = 'password123'; // TODO: Replace with real check
    if (this.verifyQuestionsPassword === correctPassword) {
      this.showVerifyQuestionsModal = false;
      this.identityConfirmed = true;
      if (this.pendingAction === 'questions') {
        this.isSavingQuestions = true;
        setTimeout(() => {
          this.isSavingQuestions = false;
          // Simulate save
        }, 1200);
      } else if (this.pendingAction === 'recovery') {
        this.isSavingRecovery = true;
        setTimeout(() => {
          this.isSavingRecovery = false;
          // Simulate save
        }, 1200);
      }
      this.pendingAction = null;
      return;
    } else {
      this.verifyQuestionsError = 'Incorrect password';
    }
  }

  closeVerifyQuestionsModal(): void {
    this.showVerifyQuestionsModal = false;
    this.verifyQuestionsPassword = '';
    this.verifyQuestionsError = '';
  }

  onSaveRecoveryOptions(): void {
    if (!this.recoveryOptionsValid) return;
    if (this.identityConfirmed) {
      this.isSavingRecovery = true;
      setTimeout(() => {
        this.isSavingRecovery = false;
        // Simulate save
      }, 1200);
      return;
    }
    this.pendingAction = 'recovery';
    this.verifyQuestionsPassword = '';
    this.verifyQuestionsError = '';
    this.showVerifyQuestionsModal = true;
  }
}
