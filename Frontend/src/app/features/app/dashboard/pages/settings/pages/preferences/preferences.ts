import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-settings-preferences',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
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
  isHeaderSticky = false;
  headerStickyTop = 0;
  headerStickyLeft = 0;
  headerStickyWidth = 0;
  headerPlaceholderHeight = 0;
  private scrollRoot?: HTMLElement;
  private stickyRafId: number | null = null;
  private readonly stickyThreshold = 12;
  private readonly handleStickyScroll = () => this.scheduleStickyUpdate();
  private readonly handleStickyResize = () => this.scheduleStickyUpdate();

  themes = [
    { id: 'light', label: 'Light', icon: '☀️' },
    { id: 'dark', label: 'Dark', icon: '🌙' },
    { id: 'system', label: 'System', icon: '💻' }
  ];

  languages = [
    { code: 'en', label: 'English' },
    { code: 'fr', label: 'Français' }
  ];

  constructor(private fb: FormBuilder) {
    this.initForm();
  }

  ngOnInit() {
    // Load saved preferences
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
  }

  private initForm() {
    this.preferencesForm = this.fb.group({
      theme: ['light', Validators.required],
      language: ['en', Validators.required]
    });
  }

  onSave() {
    if (this.preferencesForm.valid) {
      this.isSaving = true;
      // Simulate API call
      setTimeout(() => {
        this.isSaving = false;
        console.log('Preferences saved:', this.preferencesForm.value);
      }, 1500);
    }
  }

  onCancel() {
    this.preferencesForm.reset({
      theme: 'light',
      language: 'en'
    });
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
    const shouldStick = this.isHeaderSticky
      ? offset <= this.stickyThreshold
      : offset <= -this.stickyThreshold;

    this.isHeaderSticky = shouldStick;

    if (!shouldStick) {
      this.headerPlaceholderHeight = 0;
      return;
    }

    this.headerStickyTop = rootRect.top + 10;
    this.headerStickyLeft = containerRect.left + 8;
    this.headerStickyWidth = Math.max(containerRect.width - 16, 0);
    this.headerPlaceholderHeight = this.profileHeader.nativeElement.offsetHeight;
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

