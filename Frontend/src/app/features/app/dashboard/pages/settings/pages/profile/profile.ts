import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AppIcon } from '../../../../../../../shared/app/icons/app-icon';

@Component({
  selector: 'app-settings-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AppIcon],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class SettingsProfile implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);

  profileForm!: FormGroup;
  avatarPreview: string | ArrayBuffer | null = null;
  isSaving = false;
  userEmail = 'iskanderboughnimi@gmail.com';

  readonly socialMediaPlatforms = [
    { id: 'google', label: 'Google Account', status: 'connected' },
    { id: 'facebook', label: 'Facebook Account', status: 'disconnected' }
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
      return;
    }

    this.isSaving = true;
    // Simulate API call
    setTimeout(() => {
      this.isSaving = false;
      console.log('Profile saved:', this.profileForm.getRawValue());
      // Call toast notification service here
    }, 1500);
  }

  onCancel(): void {
    this.profileForm.reset();
    this.avatarPreview = null;
  }

  removeAvatar(): void {
    this.avatarPreview = null;
  }

  getFieldError(fieldName: string): string | null {
    const field = this.profileForm.get(fieldName);
    if (field?.hasError('required')) return 'This field is required';
    if (field?.hasError('minlength')) return `Minimum ${field.getError('minlength').requiredLength} characters`;
    if (field?.hasError('pattern')) return 'Invalid format';
    return null;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.profileForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  openEmailModal() {
    this.initEmailChangeForm();
    this.showEmailModal = true;
    this.showResetPasswordMsg = false;
    this.showEmailCodeModal = false;
    this.showCancelConfirmModal = false;
  }

  closeEmailModal() {
    this.showEmailModal = false;
    this.showResetPasswordMsg = false;
  }

  forgotPassword() {
    this.showResetPasswordMsg = true;
    this.resetPasswordMsg = 'Reset password instructions were sent to your email.';
  }

  confirmEmailChange() {
    if (this.emailChangeForm.valid) {
      // Simulate API call and open code modal
      this.emailToConfirm = this.emailChangeForm.value.newEmail;
      this.showEmailModal = false;
      this.initEmailCodeForm();
      this.showEmailCodeModal = true;
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
      // Simulate code validation
      this.showEmailCodeModal = false;
      // Success logic here
    } else {
      this.emailCodeForm.markAllAsTouched();
    }
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
    // Reset all forms if needed
  }
}
