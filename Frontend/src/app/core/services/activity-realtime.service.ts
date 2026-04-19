import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { ActivityRealtimeEvent } from '../models/user.model';
import { getWebSocketUrl } from '../config/runtime-endpoints';

@Injectable({
  providedIn: 'root'
})
export class ActivityRealtimeService {
  private readonly socketUrl = getWebSocketUrl('activity');
  private socket: WebSocket | null = null;
  private reconnectTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private manuallyDisconnected = false;
  private readonly eventsSubject = new Subject<ActivityRealtimeEvent>();

  readonly events$: Observable<ActivityRealtimeEvent> = this.eventsSubject.asObservable();

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
      this.socket.onclose = null;
      this.socket.onerror = null;
      this.socket.onmessage = null;
      this.socket.close();
      this.socket = null;
    }
  }

  private handleMessage(rawMessage: string): void {
    try {
      const event = JSON.parse(rawMessage) as ActivityRealtimeEvent;
      if (event.type === 'activity_refresh') {
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
