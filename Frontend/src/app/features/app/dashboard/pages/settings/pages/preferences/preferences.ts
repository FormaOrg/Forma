import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { ProfileService } from '../../../../../../../core/services/profile.service';
import { ToastService } from '../../../../../../../core/services/toast.service';
import { I18nService } from '../../../../../../landing-page/i18n/i18n.service';
import { TranslatePipe } from '../../../../../../landing-page/i18n/translate.pipe';

@Component({
  selector: 'app-settings-preferences',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './preferences.html',
  styleUrl: './preferences.css'
})
export class SettingsPreferences implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('headerSentinel', { static: true }) headerSentinel?: ElementRef<HTMLDivElement>;
  @ViewChild('profileContainer', { static: true }) profileContainer?: ElementRef<HTMLDivElement>;
  @ViewChild('profileHeader', { static: true }) profileHeader?: ElementRef<HTMLDivElement>;

  preferencesForm!: FormGroup;
  isSaving = false;
  showDeleteModal = false;
  private readonly themeStorageKey = 'forma_theme_preference';
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

  themes = [
    { id: 'light', labelKey: 'settings.preferences.theme.light', icon: '☀️' },
    { id: 'dark', labelKey: 'settings.preferences.theme.dark', icon: '🌙' },
    { id: 'system', labelKey: 'settings.preferences.theme.system', icon: '💻' }
  ];

  languages = [
    { code: 'en', label: 'English' },
    { code: 'fr', label: 'Français' }
  ];

  constructor(
    private fb: FormBuilder,
    private profileService: ProfileService,
    private toastService: ToastService,
    private i18n: I18nService
  ) {
    this.initForm();
  }

  ngOnInit() {
    this.loadPreferences();
    this.preferencesForm.get('language')?.valueChanges.subscribe(language => {
      if (language === 'en' || language === 'fr') {
        void this.i18n.setLang(language);
      }
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

  private initForm() {
    this.preferencesForm = this.fb.group({
      theme: [this.readSavedTheme(), Validators.required],
      language: [this.i18n.lang(), Validators.required]
    });
  }

  onSave() {
    if (this.preferencesForm.invalid) {
      this.preferencesForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    const language = this.preferencesForm.get('language')?.value;
    const theme = this.preferencesForm.get('theme')?.value;

    if (theme) {
      localStorage.setItem(this.themeStorageKey, theme);
    }

    this.profileService.updateMyPreferences({ preferredLanguage: language })
      .pipe(finalize(() => this.isSaving = false))
      .subscribe({
        next: () => {
          this.toastService.success(this.i18n.t('settings.preferences.toast.saved'));
        },
        error: error => {
          this.toastService.error(error?.error?.message ?? this.i18n.t('settings.preferences.toast.saveError'));
        }
      });
  }

  onCancel() {
    this.loadPreferences();
  }

  onDeleteAccount() {
    this.showDeleteModal = true;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
  }

  confirmDeleteAccount() {
    this.showDeleteModal = false;
    console.log('Account deletion requested');
    // TODO: Call API to delete account
  }

  private loadPreferences(): void {
    const fallbackTheme = this.readSavedTheme();
    const currentLanguage = this.i18n.lang();
    this.profileService.getMyProfile().subscribe({
      next: () => {
        this.preferencesForm.reset({
          theme: fallbackTheme,
          language: currentLanguage
        }, { emitEvent: false });
      },
      error: () => {
        this.preferencesForm.reset({
          theme: fallbackTheme,
          language: currentLanguage
        }, { emitEvent: false });
      }
    });
  }

  private readSavedTheme(): string {
    return localStorage.getItem(this.themeStorageKey) ?? 'light';
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

