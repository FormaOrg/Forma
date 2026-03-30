import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface ActiveSession {
  id: string;
  deviceName: string;
  deviceType: 'Desktop' | 'Mobile' | 'Tablet';
  browser: string;
  os: string;
  location: string;
  ipAddress: string;
  lastActive: Date;
  isCurrent: boolean;
}

interface LoginRecord {
  id: string;
  timestamp: Date;
  deviceName: string;
  deviceType: 'Desktop' | 'Mobile' | 'Tablet';
  browser: string;
  os: string;
  location: string;
  ipAddress: string;
  status: 'success' | 'failed';
  failureReason?: string;
}

@Component({
  selector: 'app-settings-activity',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './activity.html',
  styleUrl: './activity.css'
})
export class SettingsActivity implements OnInit {
  activeSessions: ActiveSession[] = [];
  loginHistory: LoginRecord[] = [];
  isSigningOutAll = false;

  // Modal states
  showSessionsModal = false;
  showLoginHistoryModal = false;

  // Filter states for sessions
  sessionsFilterDeviceType: 'all' | 'Desktop' | 'Mobile' | 'Tablet' = 'all';

  // Filter states for login history
  loginFilterStatus: 'all' | 'success' | 'failed' = 'all';
  loginFilterDateRange: 'all' | '7days' | '30days' | '90days' = 'all';

  get filteredSessions(): ActiveSession[] {
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
        if (login.timestamp < cutoffDate) {
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

  private loadActiveSessions(): void {
    // Mock data for active sessions
    this.activeSessions = [
      {
        id: '1',
        deviceName: 'Chrome on Windows',
        deviceType: 'Desktop',
        browser: 'Chrome 123.0',
        os: 'Windows 11',
        location: 'Tunis, Tunisia',
        ipAddress: '192.168.1.100',
        lastActive: new Date(Date.now() - 5 * 60000), // 5 minutes ago
        isCurrent: true
      },
      {
        id: '2',
        deviceName: 'Safari on iPhone',
        deviceType: 'Mobile',
        browser: 'Safari 17.2',
        os: 'iOS 17',
        location: 'Sousse, Tunisia',
        ipAddress: '203.0.113.45',
        lastActive: new Date(Date.now() - 2 * 3600000), // 2 hours ago
        isCurrent: false
      },
      {
        id: '3',
        deviceName: 'Firefox on Ubuntu',
        deviceType: 'Desktop',
        browser: 'Firefox 123.0',
        os: 'Ubuntu 22.04',
        location: 'Paris, France',
        ipAddress: '198.51.100.78',
        lastActive: new Date(Date.now() - 48 * 3600000), // 2 days ago
        isCurrent: false
      }
    ];
  }

  private loadLoginHistory(): void {
    // Mock data for login history
    this.loginHistory = [
      {
        id: '1',
        timestamp: new Date(Date.now() - 5 * 60000),
        deviceName: 'Chrome on Windows',
        deviceType: 'Desktop',
        browser: 'Chrome 123.0',
        os: 'Windows 11',
        location: 'Tunis, Tunisia',
        ipAddress: '192.168.1.100',
        status: 'success'
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 2.5 * 3600000),
        deviceName: 'Safari on iPhone',
        deviceType: 'Mobile',
        browser: 'Safari 17.2',
        os: 'iOS 17',
        location: 'Sousse, Tunisia',
        ipAddress: '203.0.113.45',
        status: 'success'
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 5 * 3600000),
        deviceName: 'Unknown Device',
        deviceType: 'Desktop',
        browser: 'Chrome 123.0',
        os: 'Windows 11',
        location: 'Cairo, Egypt',
        ipAddress: '198.51.100.200',
        status: 'failed',
        failureReason: 'Incorrect password'
      },
      {
        id: '4',
        timestamp: new Date(Date.now() - 24 * 3600000),
        deviceName: 'Firefox on Ubuntu',
        deviceType: 'Desktop',
        browser: 'Firefox 123.0',
        os: 'Ubuntu 22.04',
        location: 'Paris, France',
        ipAddress: '198.51.100.78',
        status: 'success'
      },
      {
        id: '5',
        timestamp: new Date(Date.now() - 48 * 3600000),
        deviceName: 'Chrome on Windows',
        deviceType: 'Desktop',
        browser: 'Chrome 123.0',
        os: 'Windows 11',
        location: 'Tunis, Tunisia',
        ipAddress: '192.168.1.100',
        status: 'success'
      }
    ];
  }

  signOutSession(sessionId: string): void {
    this.activeSessions = this.activeSessions.filter(s => s.id !== sessionId);
  }

  signOutAllOtherSessions(): void {
    this.isSigningOutAll = true;
    setTimeout(() => {
      this.activeSessions = this.activeSessions.filter(s => s.isCurrent);
      this.isSigningOutAll = false;
    }, 1200);
  }

  formatTimeAgo(date: Date): string {
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  formatDate(date: Date): string {
    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return date.toLocaleDateString('en-US', options);
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
}
