import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivitySession, LoginRecord } from '../../../../../../../core/models/user.model';
import { ProfileService } from '../../../../../../../core/services/profile.service';
import { ToastService } from '../../../../../../../core/services/toast.service';

@Component({
  selector: 'app-settings-activity',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './activity.html',
  styleUrl: './activity.css'
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
  headerStickyTop = 0;
  headerStickyLeft = 0;
  headerStickyWidth = 0;
  headerPlaceholderHeight = 0;
  private scrollRoot?: HTMLElement;
  private stickyRafId: number | null = null;
  private readonly stickyThreshold = 12;
  private readonly handleStickyScroll = () => this.scheduleStickyUpdate();
  private readonly handleStickyResize = () => this.scheduleStickyUpdate();

  // Modal states
  showSessionsModal = false;
  showLoginHistoryModal = false;

  // Filter states for sessions
  sessionsFilterDeviceType: 'all' | 'Desktop' | 'Mobile' | 'Tablet' = 'all';

  // Filter states for login history
  loginFilterStatus: 'all' | 'success' | 'failed' = 'all';
  loginFilterDateRange: 'all' | '7days' | '30days' | '90days' = 'all';

  constructor(
    private profileService: ProfileService,
    private toastService: ToastService
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
      // Filter by status
      if (this.loginFilterStatus !== 'all' && login.status !== this.loginFilterStatus) {
        return false;
      }
      // Filter by date range
      if (this.loginFilterDateRange !== 'all') {
        const daysAgo = this.loginFilterDateRange === '7days' ? 7 : this.loginFilterDateRange === '30days' ? 30 : 90;
        const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 3600000);
        if (new Date(login.timestamp) < cutoffDate) {
          return false;
        }
      }
      return true;
    });
  }

  ngOnInit(): void {
    this.loadActiveSessions();
    this.loadLoginHistory();
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

  private loadActiveSessions(): void {
    this.isLoadingSessions = true;
    this.profileService.getMyActiveSessions().subscribe({
      next: (sessions) => {
        this.activeSessions = this.normalizeCurrentSession(sessions);
        this.isLoadingSessions = false;
      },
      error: (err) => {
        this.isLoadingSessions = false;
        this.toastService.error(err?.error?.message ?? 'Failed to load active sessions.');
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
        this.toastService.error(err?.error?.message ?? 'Failed to load login history.');
      }
    });
  }

  signOutSession(sessionId: string): void {
    this.profileService.signOutMySession(sessionId).subscribe({
      next: (response) => {
        this.activeSessions = this.activeSessions.filter(s => s.id !== sessionId);
        this.toastService.success(response.message || 'Session signed out.');
      },
      error: (err) => {
        this.toastService.error(err?.error?.message ?? 'Failed to sign out that session.');
      }
    });
  }

  signOutAllOtherSessions(): void {
    this.isSigningOutAll = true;
    this.profileService.signOutAllOtherSessions().subscribe({
      next: (response) => {
        this.activeSessions = this.activeSessions.filter(s => s.isCurrent);
        this.isSigningOutAll = false;
        this.toastService.success(response.message || 'Other sessions signed out.');
      },
      error: (err) => {
        this.isSigningOutAll = false;
        this.toastService.error(err?.error?.message ?? 'Failed to sign out other sessions.');
      }
    });
  }

  formatTimeAgo(date: string): string {
    const parsedDate = new Date(date);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - parsedDate.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  formatDate(date: string): string {
    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(date).toLocaleDateString('en-US', options);
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
    this.loginFilterStatus = 'all';
    this.loginFilterDateRange = 'all';
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
