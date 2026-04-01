import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  inject
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AppIcon } from '../../../../../../../shared/app/icons/app-icon';
import { finalize } from 'rxjs';
import { AuthService } from '../../../../../../../core/services/auth.service';
import { ProfileService, UserProfileResponse } from '../../../../../../../core/services/profile.service';
import { ToastService } from '../../../../../../../core/services/toast.service';
import { TranslatePipe } from '../../../../../../landing-page/i18n/translate.pipe';
import { I18nService } from '../../../../../../landing-page/i18n/i18n.service';

@Component({
  selector: 'app-settings-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AppIcon, TranslatePipe],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class SettingsProfile implements OnInit, AfterViewInit, OnDestroy {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private profileService = inject(ProfileService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private i18n = inject(I18nService);

  @ViewChild('headerSentinel', { static: true }) headerSentinel?: ElementRef<HTMLDivElement>;
  @ViewChild('profileContainer', { static: true }) profileContainer?: ElementRef<HTMLDivElement>;
  @ViewChild('profileHeader', { static: true }) profileHeader?: ElementRef<HTMLDivElement>;

  profileForm!: FormGroup;
  avatarPreview: string | ArrayBuffer | null = null;
  isSaving = false;
  isLoadingProfile = false;
  isSubmittingEmailChange = false;
  isConfirmingEmailChange = false;
  userEmail = '';
  profileError = '';
  profileSuccess = '';
  emailChangeError = '';
  emailChangeSuccess = '';
  emailCodeError = '';
  initialProfileValue: Record<string, string> | null = null;
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

  readonly socialMediaPlatforms = [
    { id: 'google', labelKey: 'settings.profile.social.google', status: 'connected' },
    { id: 'facebook', labelKey: 'settings.profile.social.facebook', status: 'disconnected' }
  ];

  readonly timezones = [
    '(UTC-12:00) International Date Line West',
    '(UTC-11:00) Coordinated Universal Time-11',
    '(UTC-10:00) Hawaii',
    '(UTC-09:00) Alaska',
    '(UTC-08:00) Baja California, Pacific Time',
    '(UTC-07:00) Arizona, Mountain Time',
    '(UTC-06:00) Central Time',
    '(UTC-05:00) Eastern Time',
    '(UTC-04:00) Atlantic Time',
    '(UTC-03:30) Newfoundland',
    '(UTC-03:00) Brasília, Buenos Aires, Greenland',
    '(UTC-02:00) Mid-Atlantic',
    '(UTC-01:00) Azores, Cape Verde',
    '(UTC) Casablanca, Dublin, London',
    '(UTC+01:00) Amsterdam, Berlin, Paris, Rome',
    '(UTC+02:00) Cairo, Johannesburg, Istanbul',
    '(UTC+03:00) Baghdad, Riyadh, Moscow',
    '(UTC+03:30) Tehran',
    '(UTC+04:00) Dubai, Baku',
    '(UTC+04:30) Kabul',
    '(UTC+05:00) Karachi, Tashkent',
    '(UTC+05:30) India Standard Time',
    '(UTC+05:45) Nepal',
    '(UTC+06:00) Almaty, Dhaka, Astana',
    '(UTC+06:30) Myanmar',
    '(UTC+07:00) Bangkok, Jakarta, Hanoi',
    '(UTC+08:00) Beijing, Shanghai, Hong Kong, Singapore',
    '(UTC+08:45) Eucla',
    '(UTC+09:00) Tokyo, Seoul, Osaka',
    '(UTC+09:30) Adelaide, Darwin',
    '(UTC+10:00) Brisbane, Sydney, Melbourne',
    '(UTC+10:30) Lord Howe Island',
    '(UTC+11:00) Solomon Islands, New Caledonia',
    '(UTC+12:00) Fiji, Kamchatka, Wallis and Futuna',
    '(UTC+12:45) Chatham Islands',
    '(UTC+13:00) Nadi, Kiritimati',
    '(UTC+14:00) Kiribati'
  ];

  readonly countries = [
    'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cambodia', 'Cameroon', 'Canada', 'Cape Verde', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic', 'Czechia', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic', 'East Timor', 'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia', 'Fiji', 'Finland', 'France', 'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Gibraltar', 'Greece', 'Grenada', 'Guatemala', 'Guernsey', 'Guinea', 'Guinea-Bissau', 'Guyana', 'Haiti', 'Honduras', 'Hong Kong', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Isle of Man', 'Italy', 'Jamaica', 'Japan', 'Jersey', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 'Kosovo', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Macao', 'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'North Macedonia', 'Norway', 'Oman', 'Pakistan', 'Palau', 'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Puerto Rico', 'Qatar', 'Republic of Congo', 'Republic of the Sudan', 'Romania', 'Russia', 'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa', 'South Korea', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria', 'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'The Bahamas', 'The Gambia', 'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu', 'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan', 'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe'
  ];


  // ...existing code...
  // Popup state
  showEmailModal = false;
  showResetPasswordMsg = false;
  showEmailCodeModal = false;
  showCancelConfirmModal = false;
  emailChangeForm!: FormGroup;
  emailCodeForm!: FormGroup;
  resetPasswordMsg = '';
  emailToConfirm = '';

  ngOnInit(): void {
    this.initForm();
    this.loadProfile();
    this.route.queryParamMap.subscribe(params => {
      if (params.get('changeEmail')) {
        setTimeout(() => {
          const el = document.getElementById('personal-info-section');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
          this.openEmailModal();
        }, 100);
      }
    });
  }

  private initForm(): void {
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: [{ value: this.userEmail, disabled: true }, Validators.required],
      username: ['', [Validators.required, Validators.minLength(3)]],
      phone: ['', [Validators.pattern(/^[0-9\-\+\(\)\s]*$/)]],
      country: ['', Validators.required],
      website: ['', [Validators.pattern(/^(https?:\/\/)?.*/)]]
    });
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

  private loadProfile(): void {
    this.isLoadingProfile = true;
    this.profileError = '';

    this.profileService.getMyProfile()
      .pipe(finalize(() => this.isLoadingProfile = false))
      .subscribe({
        next: profile => this.applyProfile(profile),
        error: error => {
          this.profileError = error?.error?.message ?? this.i18n.t('settings.profile.error.load');
        }
      });
  }

  private applyProfile(profile: UserProfileResponse): void {
    this.userEmail = profile.email;
    this.profileForm.patchValue({
      firstName: profile.firstName ?? '',
      lastName: profile.lastName ?? '',
      email: profile.email ?? '',
      username: profile.username ?? '',
      phone: profile.phone ?? '',
      country: profile.country ?? '',
      website: profile.website ?? ''
    });
    this.initialProfileValue = this.getNormalizedProfileFormValue();
  }

  get hasProfileChanges(): boolean {
    if (!this.initialProfileValue) {
      return false;
    }

    const currentValue = this.getNormalizedProfileFormValue();
    return Object.keys(this.initialProfileValue).some(
      key => currentValue[key] !== this.initialProfileValue?.[key]
    );
  }

  private initEmailChangeForm(): void {
    this.emailChangeForm = this.fb.group({
      password: ['', Validators.required],
      newEmail: ['', [Validators.required, Validators.email]],
      confirmEmail: ['', [Validators.required, Validators.email]]
    }, { validators: this.emailsMatchValidator });
  }

  private emailsMatchValidator(form: FormGroup) {
    const newEmail = form.get('newEmail')?.value;
    const confirmEmail = form.get('confirmEmail')?.value;
    return newEmail === confirmEmail ? null : { emailsMismatch: true };
  }

  onAvatarChange(event: any): void {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.avatarPreview = reader.result;
      };
      reader.readAsDataURL(file);
    }
  }

  onSave(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    this.profileError = '';
    this.profileSuccess = '';

    const { firstName, lastName, username, phone, country, website } = this.profileForm.getRawValue();
    this.profileService.updateMyProfile({
      firstName: this.normalizeRequiredText(firstName),
      lastName: this.normalizeRequiredText(lastName),
      username: this.normalizeOptionalText(username),
      phone: this.normalizeOptionalText(phone),
      country: this.normalizeOptionalText(country),
      website: this.normalizeOptionalText(website)
    })
      .pipe(finalize(() => this.isSaving = false))
      .subscribe({
        next: profile => {
          this.applyProfile(profile);
          this.profileSuccess = 'Profile updated successfully.';
          this.toastService.success(this.i18n.t('settings.profile.toast.updated'));
        },
        error: error => {
          this.profileError = error?.error?.message ?? this.i18n.t('settings.profile.error.update');
          this.toastService.error(this.profileError);
        }
      });
  }

  onCancel(): void {
    if (this.initialProfileValue) {
      this.profileForm.reset({
        ...this.initialProfileValue,
        email: this.userEmail
      });
    }
    this.avatarPreview = null;
    this.profileError = '';
    this.profileSuccess = '';
  }

  removeAvatar(): void {
    this.avatarPreview = null;
  }

  getFieldError(fieldName: string): string | null {
    const field = this.profileForm.get(fieldName) ?? this.emailChangeForm?.get(fieldName);
    if (field?.hasError('required')) return this.i18n.t('validation.required');
    if (field?.hasError('minlength')) {
      const requiredLength = field.getError('minlength').requiredLength;
      return this.i18n.lang() === 'fr'
        ? `Minimum ${requiredLength} caracteres`
        : `Minimum ${requiredLength} characters`;
    }
    if (field?.hasError('email')) return this.i18n.t('validation.invalidEmail');
    if (field?.hasError('pattern')) return this.i18n.t('validation.invalidFormat');
    if (fieldName === 'confirmEmail' && this.emailChangeForm?.hasError('emailsMismatch')) return this.i18n.t('validation.emailsMismatch');
    return null;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.profileForm.get(fieldName) ?? this.emailChangeForm?.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  openEmailModal() {
    this.initEmailChangeForm();
    this.showEmailModal = true;
    this.showResetPasswordMsg = false;
    this.showEmailCodeModal = false;
    this.showCancelConfirmModal = false;
    this.emailChangeError = '';
    this.emailChangeSuccess = '';
  }

  closeEmailModal() {
    this.showEmailModal = false;
    this.showResetPasswordMsg = false;
    this.emailChangeError = '';
    this.emailChangeSuccess = '';
  }

  forgotPassword() {
    this.authService.forgotPassword(this.userEmail).subscribe({
      next: response => {
        this.showResetPasswordMsg = true;
        this.resetPasswordMsg = response.message;
        this.toastService.info(response.message);
      },
      error: error => {
        this.showResetPasswordMsg = true;
        this.resetPasswordMsg = error?.error?.message ?? this.i18n.t('settings.profile.error.resetPassword');
        this.toastService.error(this.resetPasswordMsg);
      }
    });
  }

  confirmEmailChange() {
    if (this.emailChangeForm.valid) {
      this.isSubmittingEmailChange = true;
      this.emailChangeError = '';

      this.profileService.requestEmailChange({
        currentPassword: this.normalizeRequiredText(this.emailChangeForm.value.password),
        newEmail: this.normalizeRequiredText(this.emailChangeForm.value.newEmail).toLowerCase()
      })
        .pipe(finalize(() => this.isSubmittingEmailChange = false))
        .subscribe({
          next: response => {
            this.emailChangeSuccess = response.message;
            this.emailToConfirm = this.emailChangeForm.value.newEmail;
            this.showEmailModal = false;
            this.initEmailCodeForm();
            this.showEmailCodeModal = true;
            this.toastService.info(response.message);
          },
          error: error => {
            this.emailChangeError = error?.error?.message ?? this.i18n.t('settings.profile.error.startEmailChange');
            this.toastService.error(this.emailChangeError);
          }
        });
    } else {
      this.emailChangeForm.markAllAsTouched();
    }
  }

  // Email code confirmation popup
  initEmailCodeForm() {
    this.emailCodeForm = this.fb.group({
      code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
    });
  }

  submitEmailCode() {
    if (this.emailCodeForm.valid) {
      this.isConfirmingEmailChange = true;
      this.emailCodeError = '';
      this.profileService.confirmEmailChange({ code: this.emailCodeForm.value.code })
        .pipe(finalize(() => this.isConfirmingEmailChange = false))
        .subscribe({
          next: response => {
            this.authService.applyAuthResponse(response);
            this.showEmailCodeModal = false;
            this.userEmail = response.user.email;
            this.applyProfile({
              id: response.user.id,
              firstName: response.user.firstName,
              lastName: response.user.lastName,
              username: response.user.username,
              email: response.user.email,
              phone: response.user.phone,
              country: response.user.country,
              website: response.user.website,
              role: response.user.role,
              isActive: response.user.isActive ?? true,
              emailVerified: response.user.emailVerified ?? true,
              createdAt: response.user.createdAt,
              updatedAt: response.user.updatedAt
            });
            this.profileSuccess = 'Email updated successfully.';
            this.toastService.success(this.i18n.t('settings.profile.toast.emailUpdated'));
          },
          error: error => {
            this.emailCodeError = error?.error?.message ?? this.i18n.t('settings.profile.error.invalidCode');
            this.toastService.error(this.emailCodeError);
          }
        });
    } else {
      this.emailCodeForm.markAllAsTouched();
    }
  }

  resendEmailCode() {
    this.emailCodeError = '';
    this.profileService.resendEmailChangeCode().subscribe({
      next: response => {
        this.emailChangeSuccess = response.message;
        this.toastService.info(response.message);
      },
      error: error => {
        this.emailCodeError = error?.error?.message ?? this.i18n.t('settings.profile.error.resendCode');
        this.toastService.error(this.emailCodeError);
      }
    });
  }

  cancelEmailCode() {
    this.showCancelConfirmModal = true;
  }

  closeCancelConfirmModal() {
    this.showCancelConfirmModal = false;
  }

  confirmCancelChange() {
    this.showCancelConfirmModal = false;
    this.showEmailCodeModal = false;
    this.showEmailModal = false;
    this.emailCodeError = '';
    this.emailChangeError = '';
  }

  private normalizeOptionalText(value: string | null | undefined): string | undefined {
    if (value == null) return undefined;
    const trimmed = value.trim();
    return trimmed.length ? trimmed : undefined;
  }

  private normalizeRequiredText(value: string | null | undefined): string {
    return (value ?? '').trim();
  }

  private getNormalizedProfileFormValue(): Record<string, string> {
    const { firstName, lastName, username, phone, country, website } = this.profileForm.getRawValue();

    return {
      firstName: this.normalizeRequiredText(firstName),
      lastName: this.normalizeRequiredText(lastName),
      username: this.normalizeOptionalText(username) ?? '',
      phone: this.normalizeOptionalText(phone) ?? '',
      country: this.normalizeOptionalText(country) ?? '',
      website: this.normalizeOptionalText(website) ?? ''
    };
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

  private scheduleStickyUpdate(): void {
    if (this.stickyRafId !== null) {
      return;
    }

    this.stickyRafId = requestAnimationFrame(() => {
      this.stickyRafId = null;
      this.updateStickyHeader();
    });
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
