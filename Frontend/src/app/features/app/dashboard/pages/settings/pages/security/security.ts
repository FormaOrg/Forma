import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { ProfileService } from '../../../../../../../core/services/profile.service';
import { ToastService } from '../../../../../../../core/services/toast.service';
import { TranslatePipe } from '../../../../../../landing-page/i18n/translate.pipe';
import { I18nService } from '../../../../../../landing-page/i18n/i18n.service';

@Component({
  selector: 'app-settings-security',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, TranslatePipe],
  templateUrl: './security.html',
})
export class SettingsSecurity implements OnInit, AfterViewInit, OnDestroy {
  private readonly sensitiveVerificationKey = 'forma_security_settings_verified';
  @ViewChild('headerSentinel', { static: true }) headerSentinel?: ElementRef<HTMLDivElement>;
  @ViewChild('profileContainer', { static: true }) profileContainer?: ElementRef<HTMLDivElement>;
  @ViewChild('profileHeader', { static: true }) profileHeader?: ElementRef<HTMLDivElement>;

  pendingAction: 'questions' | 'recovery' | null = null;
  showVerifyQuestionsModal = false;
  verifyQuestionsPassword = '';
  verifyQuestionsError = '';
  showPasswordStrengthHint = false;
  showLoginVerificationCodeModal = false;
  showDisableLoginVerificationModal = false;
  isHeaderSticky = false;
  isHeaderExiting = false;
  headerStickyTop = 0;
  headerStickyLeft = 0;
  headerStickyWidth = 0;
  headerPlaceholderHeight = 0;
  private scrollRoot?: HTMLElement;
  private stickyRafId: number | null = null;
  private stickyExitTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private stickySpacerRafId: number | null = null;
  private readonly stickyThreshold = 6;
  private readonly stickyExitDurationMs = 170;
  private readonly handleStickyScroll = () => this.scheduleStickyUpdate();
  private readonly handleStickyResize = () => this.scheduleStickyUpdate();

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
    if (!emailValue && !phoneValue) return false;
    if (emailValue && !email?.valid) return false;
    if (phoneValue && !phone?.valid) return false;
    return true;
  }

  get hasRecoveryOptionsChanges(): boolean {
    if (!this.initialRecoveryOptionsValue) {
      return false;
    }

    const currentValue = this.getNormalizedRecoveryOptionsValue();
    return Object.keys(this.initialRecoveryOptionsValue).some(
      key => currentValue[key] !== this.initialRecoveryOptionsValue?.[key]
    );
  }

  securityQuestions = [
        'settings.security.questions.options.nickname',
        'settings.security.questions.options.spouseCity',
        'settings.security.questions.options.childhoodFriend',
        'settings.security.questions.options.thirdGradeStreet',
        'settings.security.questions.options.siblingBirthday',
        'settings.security.questions.options.childMiddleName',
        'settings.security.questions.options.siblingMiddleName',
        'settings.security.questions.options.sixthGradeSchool',
        'settings.security.questions.options.childhoodPhone',
        'settings.security.questions.options.grandmotherMaiden'
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
  private profileService = inject(ProfileService);
  private toastService = inject(ToastService);
  private i18n = inject(I18nService);

  securityForm!: FormGroup;
  loginVerificationCodeForm!: FormGroup;
  isSavingPassword = false;
  isSavingQuestions = false;
  isSavingRecovery = false;
  isLoadingSecuritySettings = false;
  isVerifyingSensitiveAction = false;
  is2FAEnabled = false;
  showVerifyEmailModal = false;
  userEmail = '';
  passwordError = '';
  isRequestingLoginVerification = false;
  isConfirmingLoginVerification = false;
  loginVerificationError = '';
  pendingLoginVerificationEnable = false;
  initialRecoveryOptionsValue: Record<string, string> | null = null;

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
    this.loginVerificationCodeForm = this.fb.group({
      code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
    });
    this.loadSecuritySettings();
  }

  ngAfterViewInit(): void {
    if (!this.headerSentinel?.nativeElement) {
      return;
    }

    this.scrollRoot = this.findScrollParent(this.headerSentinel.nativeElement);
    this.scrollRoot?.addEventListener('scroll', this.handleStickyScroll, { passive: true });
    window.addEventListener('resize', this.handleStickyResize);
    setTimeout(() => this.scheduleStickyUpdate());
  }

  ngOnDestroy(): void {
    this.scrollRoot?.removeEventListener('scroll', this.handleStickyScroll);
    window.removeEventListener('resize', this.handleStickyResize);
    if (this.stickyRafId !== null) {
      cancelAnimationFrame(this.stickyRafId);
    }
    if (this.stickyExitTimeoutId !== null) {
      clearTimeout(this.stickyExitTimeoutId);
    }
    if (this.stickySpacerRafId !== null) {
      cancelAnimationFrame(this.stickySpacerRafId);
    }
  }

  private passwordsMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { passwordsMismatch: true };
  }

  get newPasswordValue(): string {
    return this.securityForm?.get('newPassword')?.value ?? '';
  }

  get hasMinPasswordLength(): boolean {
    return this.newPasswordValue.length >= 8;
  }

  get hasMixedCasePassword(): boolean {
    return /[a-z]/.test(this.newPasswordValue) && /[A-Z]/.test(this.newPasswordValue);
  }

  get hasPasswordSymbol(): boolean {
    return /[^A-Za-z0-9]/.test(this.newPasswordValue);
  }

  get hasLongPassword(): boolean {
    return this.newPasswordValue.length >= 12;
  }

  get passwordStrengthScore(): number {
    return [
      this.hasMinPasswordLength,
      this.hasMixedCasePassword,
      this.hasPasswordSymbol,
      this.hasLongPassword
    ].filter(Boolean).length;
  }

  get passwordStrengthSegments(): boolean[] {
    return Array.from({ length: 4 }, (_, index) => index < this.passwordStrengthScore);
  }

  get passwordSectionValid(): boolean {
    const currentPassword = this.securityForm.get('currentPassword');
    const newPassword = this.securityForm.get('newPassword');
    const confirmPassword = this.securityForm.get('confirmPassword');

    return !!(
      currentPassword &&
      newPassword &&
      confirmPassword &&
      currentPassword.valid &&
      newPassword.valid &&
      confirmPassword.valid &&
      !this.securityForm.hasError('passwordsMismatch')
    );
  }

  onNewPasswordFocus(): void {
    this.showPasswordStrengthHint = true;
  }

  onNewPasswordBlur(): void {
    this.showPasswordStrengthHint = false;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.securityForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string | null {
    const field = this.securityForm.get(fieldName);
    if (field?.hasError('required')) return this.i18n.t('validation.required');
    if (field?.hasError('minlength')) {
      const requiredLength = field.getError('minlength').requiredLength;
      return this.i18n.lang() === 'fr'
        ? `Minimum ${requiredLength} caracteres`
        : `Minimum ${requiredLength} characters`;
    }
    if (field?.hasError('pattern')) return this.i18n.t('validation.invalidFormat');
    if (field?.hasError('email')) return this.i18n.t('validation.invalidEmail');
    if (fieldName === 'confirmPassword' && this.securityForm.hasError('passwordsMismatch')) return this.i18n.t('validation.passwordsMismatch');
    return null;
  }

  onChangePassword(): void {
    const passwordFields = ['currentPassword', 'newPassword', 'confirmPassword'] as const;
    passwordFields.forEach(field => this.securityForm.get(field)?.markAsTouched());

    if (!this.passwordSectionValid) {
      return;
    }

    this.isSavingPassword = true;
    this.passwordError = '';

    this.profileService.changeMyPassword({
      currentPassword: this.securityForm.get('currentPassword')?.value?.trim(),
      newPassword: this.securityForm.get('newPassword')?.value?.trim()
    })
      .pipe(finalize(() => this.isSavingPassword = false))
      .subscribe({
        next: response => {
          passwordFields.forEach(field => {
            this.securityForm.get(field)?.reset('');
            this.securityForm.get(field)?.markAsPristine();
            this.securityForm.get(field)?.markAsUntouched();
          });
          this.showPasswordStrengthHint = false;
          this.toastService.success(response.message || this.i18n.t('settings.security.toast.passwordChanged'));
        },
        error: error => {
          this.passwordError = error?.error?.message ?? this.i18n.t('settings.security.error.changePassword');
          this.toastService.error(this.passwordError);
        }
      });
  }

  private loadSecuritySettings(): void {
    this.isLoadingSecuritySettings = true;
    this.profileService.getMySecuritySettings().subscribe({
      next: settings => {
        this.userEmail = settings.email;
        this.is2FAEnabled = settings.loginVerificationEnabled;
        this.securityForm.patchValue({
          question1: settings.securityQuestion1 ?? '',
          question2: settings.securityQuestion2 ?? '',
          answer1: '',
          answer2: '',
          recoveryEmail: settings.recoveryEmail ?? '',
          recoveryPhone: settings.recoveryPhone ?? ''
        }, { emitEvent: false });
        this.initialRecoveryOptionsValue = this.getNormalizedRecoveryOptionsValue();
        this.isLoadingSecuritySettings = false;
      },
      error: error => {
        this.isLoadingSecuritySettings = false;
        this.toastService.error(error?.error?.message ?? this.i18n.t('settings.security.error.load'));
      }
    });
  }


  openVerifyEmailModal(): void {
    if (this.is2FAEnabled) {
      this.showDisableLoginVerificationModal = true;
      return;
    }

    this.showVerifyEmailModal = true;
    this.loginVerificationError = '';
  }

  closeVerifyEmailModal(): void {
    this.showVerifyEmailModal = false;
  }

  closeDisableLoginVerificationModal(): void {
    this.showDisableLoginVerificationModal = false;
  }

  sendVerifyEmailCode(): void {
    this.isRequestingLoginVerification = true;
    this.loginVerificationError = '';
    this.pendingLoginVerificationEnable = !this.is2FAEnabled;

    this.profileService.requestLoginVerificationChange({ enable: this.pendingLoginVerificationEnable })
      .pipe(finalize(() => this.isRequestingLoginVerification = false))
      .subscribe({
        next: response => {
          this.closeVerifyEmailModal();
          this.loginVerificationCodeForm.reset({ code: '' });
          this.showLoginVerificationCodeModal = true;
          this.toastService.info(response.message);
        },
        error: error => {
          this.loginVerificationError = error?.error?.message ?? this.i18n.t('settings.security.error.sendCode');
          this.toastService.error(this.loginVerificationError);
        }
      });
  }

  goToChangeEmail(event: Event): void {
    event.preventDefault();
    // Use Angular Router to navigate to profile page and open change email modal
    this.router.navigate(['/app/settings/profile'], { queryParams: { changeEmail: 1 } });
  }

  onSaveSecurityQuestions(): void {
    if (!this.securityQuestionsValid) {
      this.securityForm.get('question1')?.markAsTouched();
      this.securityForm.get('answer1')?.markAsTouched();
      this.securityForm.get('question2')?.markAsTouched();
      this.securityForm.get('answer2')?.markAsTouched();
      return;
    }
    this.pendingAction = 'questions';
    this.ensureSensitiveVerification();
  }

  confirmVerifyQuestionsPassword(): void {
    const currentPassword = this.verifyQuestionsPassword.trim();
    if (!currentPassword) {
      this.verifyQuestionsError = this.i18n.t('settings.security.error.requirePassword');
      this.toastService.error(this.verifyQuestionsError);
      return;
    }

    this.isVerifyingSensitiveAction = true;
    this.profileService.verifySensitiveSecurityAction({ currentPassword })
      .pipe(finalize(() => this.isVerifyingSensitiveAction = false))
      .subscribe({
        next: response => {
          sessionStorage.setItem(this.sensitiveVerificationKey, response.token);
          this.showVerifyQuestionsModal = false;
          this.verifyQuestionsPassword = '';
          this.verifyQuestionsError = '';
          this.executePendingSensitiveAction();
        },
        error: error => {
          this.verifyQuestionsError = error?.error?.message ?? this.i18n.t('settings.security.error.verifyPassword');
          this.toastService.error(this.verifyQuestionsError);
        }
      });
  }

  closeVerifyQuestionsModal(): void {
    this.showVerifyQuestionsModal = false;
    this.verifyQuestionsPassword = '';
    this.verifyQuestionsError = '';
  }

  onSaveRecoveryOptions(): void {
    if (!this.recoveryOptionsValid) {
      this.securityForm.get('recoveryEmail')?.markAsTouched();
      this.securityForm.get('recoveryPhone')?.markAsTouched();
      return;
    }
    this.pendingAction = 'recovery';
    this.ensureSensitiveVerification();
  }

  submitLoginVerificationCode(): void {
    this.loginVerificationCodeForm.get('code')?.markAsTouched();
    if (this.loginVerificationCodeForm.invalid) {
      return;
    }

    this.isConfirmingLoginVerification = true;
    this.loginVerificationError = '';
    this.profileService.confirmLoginVerificationChange({
      code: this.loginVerificationCodeForm.get('code')?.value
    })
      .pipe(finalize(() => this.isConfirmingLoginVerification = false))
      .subscribe({
        next: response => {
          this.is2FAEnabled = this.pendingLoginVerificationEnable;
          this.showLoginVerificationCodeModal = false;
          this.loginVerificationCodeForm.reset({ code: '' });
          this.toastService.success(response.message);
        },
        error: error => {
          this.loginVerificationError = error?.error?.message ?? this.i18n.t('settings.security.error.codeInvalid');
          this.toastService.error(this.loginVerificationError);
        }
      });
  }

  closeLoginVerificationCodeModal(): void {
    this.showLoginVerificationCodeModal = false;
    this.loginVerificationCodeForm.reset({ code: '' });
    this.loginVerificationError = '';
  }

  disableLoginVerification(): void {
    this.isConfirmingLoginVerification = true;

    this.profileService.disableLoginVerification()
      .pipe(finalize(() => this.isConfirmingLoginVerification = false))
      .subscribe({
        next: response => {
          this.is2FAEnabled = false;
          this.showDisableLoginVerificationModal = false;
          this.toastService.success(response.message);
        },
        error: error => {
          this.toastService.error(error?.error?.message ?? this.i18n.t('settings.security.error.disableTwoStep'));
        }
      });
  }

  private ensureSensitiveVerification(): void {
    this.verifyQuestionsPassword = '';
    this.verifyQuestionsError = '';

    if (this.getSensitiveVerificationToken()) {
      this.executePendingSensitiveAction();
      return;
    }

    this.showVerifyQuestionsModal = true;
  }

  private executePendingSensitiveAction(): void {
    if (this.pendingAction === 'questions') {
      this.submitSecurityQuestions();
      return;
    }

    if (this.pendingAction === 'recovery') {
      this.submitRecoveryOptions();
    }
  }

  private submitSecurityQuestions(): void {
    this.isSavingQuestions = true;
    this.profileService.updateMySecurityQuestions({
      verificationToken: this.getSensitiveVerificationToken() ?? undefined,
      question1: this.securityForm.get('question1')?.value?.trim(),
      answer1: this.securityForm.get('answer1')?.value?.trim(),
      question2: this.securityForm.get('question2')?.value?.trim(),
      answer2: this.securityForm.get('answer2')?.value?.trim()
    })
      .pipe(finalize(() => this.isSavingQuestions = false))
      .subscribe({
        next: response => {
          ['question1', 'answer1', 'question2', 'answer2'].forEach(fieldName => {
            this.securityForm.get(fieldName)?.markAsPristine();
            this.securityForm.get(fieldName)?.markAsUntouched();
          });
          this.toastService.success(response.message);
          this.pendingAction = null;
        },
        error: error => {
          this.handleSensitiveActionError(error, this.i18n.t('settings.security.error.questions'));
        }
      });
  }

  private submitRecoveryOptions(): void {
    this.isSavingRecovery = true;
    this.profileService.updateMyRecoveryOptions({
      verificationToken: this.getSensitiveVerificationToken() ?? undefined,
      recoveryEmail: this.securityForm.get('recoveryEmail')?.value?.trim() || undefined,
      recoveryPhone: this.securityForm.get('recoveryPhone')?.value?.trim() || undefined
    })
      .pipe(finalize(() => this.isSavingRecovery = false))
      .subscribe({
        next: response => {
          ['recoveryEmail', 'recoveryPhone'].forEach(fieldName => {
            this.securityForm.get(fieldName)?.markAsPristine();
            this.securityForm.get(fieldName)?.markAsUntouched();
          });
          this.initialRecoveryOptionsValue = this.getNormalizedRecoveryOptionsValue();
          this.toastService.success(response.message);
          this.pendingAction = null;
        },
        error: error => {
          this.handleSensitiveActionError(error, this.i18n.t('settings.security.error.recovery'));
        }
      });
  }

  private handleSensitiveActionError(error: any, fallbackMessage: string): void {
    const message = error?.error?.message ?? fallbackMessage;
    const requiresReverification = typeof message === 'string'
      && message.toLowerCase().includes('confirm your password again');

    if (requiresReverification) {
      sessionStorage.removeItem(this.sensitiveVerificationKey);
      this.verifyQuestionsPassword = '';
      this.verifyQuestionsError = '';
      this.showVerifyQuestionsModal = true;
    }

    this.toastService.error(message);
  }

  private getSensitiveVerificationToken(): string | null {
    return sessionStorage.getItem(this.sensitiveVerificationKey);
  }

  private getNormalizedRecoveryOptionsValue(): Record<string, string> {
    return {
      recoveryEmail: (this.securityForm.get('recoveryEmail')?.value ?? '').trim(),
      recoveryPhone: (this.securityForm.get('recoveryPhone')?.value ?? '').trim()
    };
  }

  private scheduleStickyUpdate(): void {
    if (this.stickyRafId !== null) {
      return;
    }

    this.stickyRafId = requestAnimationFrame(() => {
      this.stickyRafId = null;
      this.updateStickyHeader();
    });
  }

  private updateStickyHeader(): void {
    if (!this.scrollRoot || !this.headerSentinel?.nativeElement || !this.profileContainer?.nativeElement || !this.profileHeader?.nativeElement) {
      return;
    }

    const rootRect = this.scrollRoot.getBoundingClientRect();
    const sentinelRect = this.headerSentinel.nativeElement.getBoundingClientRect();
    const containerRect = this.profileContainer.nativeElement.getBoundingClientRect();
    const offset = sentinelRect.top - rootRect.top;
    const scrollTop = this.scrollRoot.scrollTop;

    if (scrollTop <= this.stickyThreshold) {
      if (this.stickyExitTimeoutId !== null) {
        clearTimeout(this.stickyExitTimeoutId);
        this.stickyExitTimeoutId = null;
      }

      this.isHeaderSticky = false;
      this.isHeaderExiting = false;
      this.headerPlaceholderHeight = 0;
      return;
    }

    const shouldStick = this.isHeaderSticky
      ? offset <= this.stickyThreshold
      : offset <= -this.stickyThreshold;

    if (shouldStick) {
      const wasSticky = this.isHeaderSticky;
      if (this.stickyExitTimeoutId !== null) {
        clearTimeout(this.stickyExitTimeoutId);
        this.stickyExitTimeoutId = null;
      }

      this.isHeaderExiting = false;
      this.isHeaderSticky = true;
      if (!wasSticky) {
        this.releaseStickySpacer();
      }
    } else if (this.isHeaderSticky) {
      this.startStickyExit();
      return;
    }

    this.headerStickyTop = rootRect.top + 10;
    this.headerStickyLeft = containerRect.left + 8;
    this.headerStickyWidth = Math.max(containerRect.width - 16, 0);
  }

  private startStickyExit(): void {
    if (this.isHeaderExiting) {
      return;
    }

    this.isHeaderExiting = true;
    this.stickyExitTimeoutId = setTimeout(() => {
      this.isHeaderSticky = false;
      this.isHeaderExiting = false;
      this.headerPlaceholderHeight = 0;
      this.stickyExitTimeoutId = null;
    }, this.stickyExitDurationMs);
  }

  private releaseStickySpacer(): void {
    this.headerPlaceholderHeight = this.getHeaderFlowHeight();
    if (this.stickySpacerRafId !== null) {
      cancelAnimationFrame(this.stickySpacerRafId);
    }

    this.stickySpacerRafId = requestAnimationFrame(() => {
      this.stickySpacerRafId = requestAnimationFrame(() => {
        if (this.isHeaderSticky && !this.isHeaderExiting) {
          this.headerPlaceholderHeight = 0;
        }
        this.stickySpacerRafId = null;
      });
    });
  }

  private getHeaderFlowHeight(): number {
    if (!this.profileHeader?.nativeElement) {
      return 0;
    }

    const style = window.getComputedStyle(this.profileHeader.nativeElement);
    const marginBottom = Number.parseFloat(style.marginBottom) || 0;
    return this.profileHeader.nativeElement.offsetHeight + marginBottom;
  }

  private findScrollParent(element: HTMLElement): HTMLElement | undefined {
    let current = element.parentElement;

    while (current) {
      const style = window.getComputedStyle(current);
      const overflowY = style.overflowY;
      const isScrollable = (overflowY === 'auto' || overflowY === 'scroll') && current.scrollHeight > current.clientHeight;

      if (isScrollable) {
        return current;
      }

      current = current.parentElement;
    }

    return undefined;
  }
}
