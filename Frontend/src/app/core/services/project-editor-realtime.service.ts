import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { StorefrontActiveEditor } from '../models/project-storefront.model';

export interface ProjectEditorPresenceEvent {
  type: 'project_editor_presence';
  projectId: number;
  activeEditors: StorefrontActiveEditor[];
  occurredAt: string;
}

export interface ProjectEditorCursorEvent {
  type: 'project_editor_cursor';
  projectId: number;
  userId: number;
  userName: string;
  avatarUrl: string | null;
  x: number | null;
  y: number | null;
  color: string;
  sectionLabel?: string | null;
}

export interface ProjectStorefrontUpdatedEvent {
  type: 'project_storefront_updated';
  projectId: number;
  userId: number;
  savedAt: string;
}

export type ProjectEditorEvent =
  | ProjectEditorPresenceEvent
  | ProjectEditorCursorEvent
  | ProjectStorefrontUpdatedEvent;

const USER_COLOR_PALETTE = [
  '#4f46e5', '#0891b2', '#059669', '#d97706',
  '#dc2626', '#7c3aed', '#db2777', '#2563eb',
];

export function deriveUserColor(userId: number): string {
  return USER_COLOR_PALETTE[Math.abs(userId) % USER_COLOR_PALETTE.length];
}

@Injectable({ providedIn: 'root' })
export class ProjectEditorRealtimeService {
  private readonly socketUrl = `${environment.projectsApiUrl.replace(/\/api$/, '').replace(/^http/, 'ws')}/ws/projects/editor-presence`;
  private socket: WebSocket | null = null;
  private reconnectTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private manuallyDisconnected = false;
  private joinedProjectId: number | null = null;
  private readonly eventsSubject = new Subject<ProjectEditorEvent>();
  private lastCursorSentAt = 0;
  private readonly CURSOR_THROTTLE_MS = 50;

  readonly events$: Observable<ProjectEditorEvent> = this.eventsSubject.asObservable();

  connect(): void {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const token = this.getToken();
    if (!token) {
      return;
    }

    this.manuallyDisconnected = false;
    this.clearReconnectTimeout();
    this.socket = new WebSocket(`${this.socketUrl}?token=${encodeURIComponent(token)}`);
    this.socket.onopen = () => {
      if (this.joinedProjectId != null) {
        this.send({
          type: 'join_project_editor',
          projectId: this.joinedProjectId,
        });
      }
    };
    this.socket.onmessage = (event) => this.handleMessage(event.data);
    this.socket.onclose = () => {
      this.socket = null;
      this.scheduleReconnect();
    };
    this.socket.onerror = () => {
      this.socket?.close();
    };
  }

  disconnect(): void {
    this.manuallyDisconnected = true;
    this.clearReconnectTimeout();

    if (this.socket) {
      this.socket.onopen = null;
      this.socket.onclose = null;
      this.socket.onerror = null;
      this.socket.onmessage = null;
      this.socket.close();
      this.socket = null;
    }
  }

  joinProject(projectId: number): void {
    if (!Number.isFinite(projectId) || projectId <= 0) {
      return;
    }

    this.joinedProjectId = projectId;
    this.connect();
    this.send({
      type: 'join_project_editor',
      projectId,
    });
  }

  leaveProject(projectId: number): void {
    if (!Number.isFinite(projectId) || projectId <= 0) {
      return;
    }

    if (this.joinedProjectId === projectId) {
      this.send({
        type: 'leave_project_editor',
        projectId,
      });
      this.joinedProjectId = null;
    }
  }

  sendCursorUpdate(payload: Omit<ProjectEditorCursorEvent, 'type'>): void {
    const now = Date.now();
    if (now - this.lastCursorSentAt < this.CURSOR_THROTTLE_MS) {
      return;
    }
    this.lastCursorSentAt = now;
    this.send({ type: 'project_editor_cursor', ...payload });
  }

  sendCursorClear(payload: Omit<ProjectEditorCursorEvent, 'type' | 'x' | 'y'>): void {
    this.lastCursorSentAt = 0;
    this.send({ type: 'project_editor_cursor', ...payload, x: null, y: null });
  }

  sendStorefrontUpdated(projectId: number, userId: number): void {
    this.send({
      type: 'project_storefront_updated',
      projectId,
      userId,
      savedAt: new Date().toISOString(),
    });
  }

  private send(payload: Record<string, unknown>): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return;
    }

    this.socket.send(JSON.stringify(payload));
  }

  private handleMessage(rawMessage: string): void {
    try {
      const event = JSON.parse(rawMessage) as ProjectEditorEvent;
      if (!event.type || !Number.isFinite((event as { projectId?: number }).projectId)) {
        return;
      }

      if (event.type === 'project_editor_presence') {
        this.eventsSubject.next({
          ...event,
          activeEditors: Array.isArray(event.activeEditors) ? event.activeEditors : [],
        });
      } else if (event.type === 'project_editor_cursor' || event.type === 'project_storefront_updated') {
        this.eventsSubject.next(event);
      }
    } catch {
      // Ignore malformed socket payloads.
    }
  }

  private scheduleReconnect(): void {
    if (this.manuallyDisconnected || !this.getToken() || this.reconnectTimeoutId !== null) {
      return;
    }

    this.reconnectTimeoutId = setTimeout(() => {
      this.reconnectTimeoutId = null;
      this.connect();
    }, 3000);
  }

  private clearReconnectTimeout(): void {
    if (this.reconnectTimeoutId !== null) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
  }

  private getToken(): string | null {
    return localStorage.getItem('forma_token') ?? sessionStorage.getItem('forma_token');
  }
}
