import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ActivityRealtimeEvent, ActivitySession, LoginRecord } from '../../../../../../../core/models/user.model';
import { ProfileService } from '../../../../../../../core/services/profile.service';
import { ToastService } from '../../../../../../../core/services/toast.service';
import { TranslatePipe } from '../../../../../../landing-page/i18n/translate.pipe';
import { I18nService } from '../../../../../../landing-page/i18n/i18n.service';
import { ActivityRealtimeService } from '../../../../../../../core/services/activity-realtime.service';

@Component({
  selector: 'app-settings-activity',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './activity.html',
})
export class SettingsActivity implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('headerSentinel', { static: true }) headerSentinel?: ElementRef<HTMLDivElement>;
  @ViewChild('profileContainer', { static: true }) profileContainer?: ElementRef<HTMLDivElement>;
  @ViewChild('profileHeader', { static: true }) profileHeader?: ElementRef<HTMLDivElement>;

  activeSessions: ActivitySession[] = [];
  loginHistory: LoginRecord[] = [];
  isSigningOutAll = false;
  isLoadingSessions = false;
  isLoadingLoginHistory = false;
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
  private realtimeSubscription?: Subscription;
  private readonly stickyThreshold = 6;
  private readonly stickyExitDurationMs = 170;
  private readonly handleStickyScroll = () => this.scheduleStickyUpdate();
  private readonly handleStickyResize = () => this.scheduleStickyUpdate();

  // Modal states
  showSessionsModal = false;
  showLoginHistoryModal = false;

  // Filter states for sessions
  sessionsFilterDeviceType: 'all' | 'Desktop' | 'Mobile' | 'Tablet' = 'all';

  // Filter states for login history
  loginFilterDateRange: '7days' | '30days' = '30days';

  constructor(
    private profileService: ProfileService,
    private toastService: ToastService,
    private i18n: I18nService,
    private activityRealtimeService: ActivityRealtimeService
  ) {}

  get filteredSessions(): ActivitySession[] {
    return this.activeSessions.filter(session => {
      if (this.sessionsFilterDeviceType !== 'all' && session.deviceType !== this.sessionsFilterDeviceType) {
        return false;
      }
      return true;
    });
  }

  get filteredLoginHistory(): LoginRecord[] {
    const now = new Date();
    return this.loginHistory.filter(login => {
      // Filter by date range
      const daysAgo = this.loginFilterDateRange === '7days' ? 7 : 30;
      const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 3600000);
      if (new Date(login.timestamp) < cutoffDate) {
        return false;
      }
      return true;
    });
  }

  ngOnInit(): void {
    this.loadActiveSessions();
    this.loadLoginHistory();
    this.connectRealtime();
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
    this.realtimeSubscription?.unsubscribe();
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

  private loadActiveSessions(): void {
    this.isLoadingSessions = true;
    this.profileService.getMyActiveSessions().subscribe({
      next: (sessions) => {
        this.activeSessions = this.normalizeCurrentSession(sessions);
        this.isLoadingSessions = false;
      },
      error: (err) => {
        this.isLoadingSessions = false;
        this.toastService.error(err?.error?.message ?? this.i18n.t('settings.activity.toast.loadSessionsError'));
      }
    });
  }

  private loadLoginHistory(): void {
    this.isLoadingLoginHistory = true;
    this.profileService.getMyLoginHistory().subscribe({
      next: (history) => {
        this.loginHistory = history;
        this.isLoadingLoginHistory = false;
      },
      error: (err) => {
        this.isLoadingLoginHistory = false;
        this.toastService.error(err?.error?.message ?? this.i18n.t('settings.activity.toast.loadHistoryError'));
      }
    });
  }

  signOutSession(sessionId: string): void {
    this.profileService.signOutMySession(sessionId).subscribe({
      next: (response) => {
        this.activeSessions = this.activeSessions.filter(s => s.id !== sessionId);
        this.toastService.success(response.message || this.i18n.t('settings.activity.toast.signOutSessionSuccess'));
      },
      error: (err) => {
        this.toastService.error(err?.error?.message ?? this.i18n.t('settings.activity.toast.signOutSessionError'));
      }
    });
  }

  signOutAllOtherSessions(): void {
    this.isSigningOutAll = true;
    this.profileService.signOutAllOtherSessions().subscribe({
      next: (response) => {
        this.activeSessions = this.activeSessions.filter(s => s.isCurrent);
        this.isSigningOutAll = false;
        this.toastService.success(response.message || this.i18n.t('settings.activity.toast.signOutOthersSuccess'));
      },
      error: (err) => {
        this.isSigningOutAll = false;
        this.toastService.error(err?.error?.message ?? this.i18n.t('settings.activity.toast.signOutOthersError'));
      }
    });
  }

  formatTimeAgo(date: string): string {
    const parsedDate = new Date(date);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - parsedDate.getTime()) / 1000);

    if (seconds < 60) return this.i18n.t('settings.activity.time.justNow');
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}${this.i18n.t('settings.activity.time.minutesAgo')}`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}${this.i18n.t('settings.activity.time.hoursAgo')}`;
    const days = Math.floor(hours / 24);
    return `${days}${this.i18n.t('settings.activity.time.daysAgo')}`;
  }

  private connectRealtime(): void {
    this.activityRealtimeService.connect();
    this.realtimeSubscription?.unsubscribe();
    this.realtimeSubscription = this.activityRealtimeService.events$.subscribe((event) => {
      this.handleRealtimeEvent(event);
    });
  }

  private handleRealtimeEvent(event: ActivityRealtimeEvent): void {
    if (event.type !== 'activity_refresh') {
      return;
    }

    this.loadActiveSessions();
    this.loadLoginHistory();
  }

  formatDate(date: string): string {
    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(date).toLocaleDateString(this.i18n.lang() === 'fr' ? 'fr-FR' : 'en-US', options);
  }

  openSessionsModal(): void {
    this.showSessionsModal = true;
  }

  closeSessionsModal(): void {
    this.showSessionsModal = false;
  }

  openLoginHistoryModal(): void {
    this.showLoginHistoryModal = true;
  }

  closeLoginHistoryModal(): void {
    this.showLoginHistoryModal = false;
  }

  resetSessionFilters(): void {
    this.sessionsFilterDeviceType = 'all';
  }

  resetLoginFilters(): void {
    this.loginFilterDateRange = '30days';
  }

  private normalizeCurrentSession(sessions: ActivitySession[]): ActivitySession[] {
    if (sessions.some(session => session.isCurrent)) {
      return sessions;
    }

    if (sessions.length === 1) {
      return [{ ...sessions[0], isCurrent: true }];
    }

    return sessions;
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
