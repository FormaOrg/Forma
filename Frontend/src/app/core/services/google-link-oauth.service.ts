import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

interface GoogleLinkConfigResponse {
  clientId: string;
  redirectUri: string;
}

interface GoogleLinkCodeRequest {
  code: string;
  redirectUri: string;
}

interface GoogleLinkResultPayload {
  state: string;
  success: boolean;
  user?: any;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class GoogleLinkOauthService {
  private readonly popupTimeoutMs = 180000;
  private readonly messageType = 'forma-google-link-result';
  private readonly channelName = 'forma-google-link';
  private readonly contextKey = 'forma_google_popup_context';
  private readonly configUrl = `${environment.apiUrl}/auth/google/link-config`;
  private readonly exchangeUrl = `${environment.apiUrl}/users/me/social/google/link/code`;
  private readonly stateKey = 'forma_google_link_state';
  private readonly resultKey = 'forma_google_link_result';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  async start(): Promise<any> {
    localStorage.setItem(this.contextKey, JSON.stringify({
      apiUrl: environment.apiUrl,
      authToken: this.authService.getToken(),
      updatedAt: Date.now()
    }));

    const config = await firstValueFrom(
      this.http.get<GoogleLinkConfigResponse>(this.configUrl)
    );

    const state = this.createState();
    localStorage.setItem(this.stateKey, state);
    localStorage.removeItem(this.resultKey);

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', config.clientId);
    authUrl.searchParams.set('redirect_uri', config.redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'openid email profile');
    authUrl.searchParams.set('prompt', 'select_account');
    authUrl.searchParams.set('state', state);

    const popup = window.open(
      authUrl.toString(),
      'forma-google-link',
      this.getPopupFeatures()
    );

    if (!popup) {
      localStorage.removeItem(this.stateKey);
      throw new Error('Google popup was blocked. Please allow popups and try again.');
    }

    popup.focus();
    return this.waitForPopupResult(state, popup);
  }

  async handleCallbackIfPresent(): Promise<void> {
    const currentUrl = new URL(window.location.href);
    const code = currentUrl.searchParams.get('code');
    const state = currentUrl.searchParams.get('state');

    if (!code || !state) {
      return;
    }

    const expectedState = localStorage.getItem(this.stateKey);
    if (!expectedState || expectedState !== state || !state.startsWith('google-link:')) {
      this.finish(state, { success: false, message: 'Invalid Google link state.' });
      return;
    }

    if (!this.authService.isLoggedIn()) {
      this.finish(state, { success: false, message: 'You must be signed in to link Google.' });
      return;
    }

    const redirectUri = this.normalizeRedirectUri(currentUrl);

    try {
      const user = await firstValueFrom(
        this.http.post<any>(this.exchangeUrl, {
          code,
          redirectUri
        } satisfies GoogleLinkCodeRequest)
      );

      this.finish(state, { success: true, user });
    } catch (error: any) {
      const message = error?.error?.message ?? 'Failed to link Google account.';
      this.finish(state, { success: false, message });
      return;
    }
  }

  private async waitForPopupResult(state: string, popup: Window): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      const channel = this.createChannel();
      const cleanup = () => {
        window.removeEventListener('storage', onStorage);
        window.removeEventListener('message', onMessage);
        window.clearInterval(pollId);
        window.clearTimeout(timeoutId);
        channel?.close();
        localStorage.removeItem(this.resultKey);
      };

      const handlePayload = (payload: GoogleLinkResultPayload) => {
        cleanup();
        localStorage.removeItem(this.stateKey);

        if (!payload.success) {
          reject(new Error(payload.message ?? 'Failed to link Google account.'));
          return;
        }

        if (payload.user && this.authService.currentUser) {
          this.authService.updateStoredUser({
            ...this.authService.currentUser,
            ...payload.user
          });
        }

        resolve(payload.user ?? null);
      };

      const onStorage = (event: StorageEvent) => {
        if (event.key !== this.resultKey || !event.newValue) {
          return;
        }

        const payload = this.parseResult(event.newValue);
        if (!payload || payload.state !== state) {
          return;
        }

        handlePayload(payload);
      };

      const onMessage = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) {
          return;
        }

        const payload = this.parseMessage(event.data);
        if (!payload || payload.state !== state) {
          return;
        }

        handlePayload(payload);
      };

      channel?.addEventListener('message', (event: MessageEvent<GoogleLinkResultPayload>) => {
        const payload = event.data;
        if (!payload || payload.state !== state) {
          return;
        }

        handlePayload(payload);
      });

      const timeoutId = window.setTimeout(() => {
        cleanup();
        localStorage.removeItem(this.stateKey);
        reject(new Error('Google linking timed out. Please try again.'));
      }, this.popupTimeoutMs);

      const pollId = window.setInterval(() => {
        const payload = this.parseResult(localStorage.getItem(this.resultKey));
        if (!payload || payload.state !== state) {
          return;
        }

        handlePayload(payload);
      }, 250);

      window.addEventListener('storage', onStorage);
      window.addEventListener('message', onMessage);
    });
  }

  private normalizeRedirectUri(url: URL): string {
    return url.pathname === '/' ? url.origin : `${url.origin}${url.pathname}`;
  }

  private finish(state: string, result: Omit<GoogleLinkResultPayload, 'state'>): void {
    if (result.success && result.user && this.authService.currentUser) {
      this.authService.updateStoredUser({
        ...this.authService.currentUser,
        ...result.user
      });
    }

    localStorage.setItem(this.resultKey, JSON.stringify({ state, ...result }));
    localStorage.removeItem(this.stateKey);

    if (window.opener) {
      this.createChannel()?.postMessage({ state, ...result });
      window.opener.postMessage(
        { type: this.messageType, payload: { state, ...result } },
        window.location.origin
      );
      window.close();
      return;
    }

    window.history.replaceState({}, '', '/app/settings/profile');
  }

  private parseResult(value: string | null): GoogleLinkResultPayload | null {
    if (!value) {
      return null;
    }

    try {
      return JSON.parse(value) as GoogleLinkResultPayload;
    } catch {
      return null;
    }
  }

  private parseMessage(value: unknown): GoogleLinkResultPayload | null {
    if (
      typeof value !== 'object' ||
      value === null ||
      !('type' in value) ||
      (value as { type?: string }).type !== this.messageType ||
      !('payload' in value)
    ) {
      return null;
    }

    return (value as { payload: GoogleLinkResultPayload }).payload;
  }

  private createChannel(): BroadcastChannel | null {
    return typeof BroadcastChannel === 'undefined'
      ? null
      : new BroadcastChannel(this.channelName);
  }

  private getPopupFeatures(): string {
    const width = 520;
    const height = 720;
    const left = Math.max(0, Math.round(window.screenX + (window.outerWidth - width) / 2));
    const top = Math.max(0, Math.round(window.screenY + (window.outerHeight - height) / 2));

    return [
      'popup=yes',
      `width=${width}`,
      `height=${height}`,
      `left=${left}`,
      `top=${top}`,
      'resizable=yes',
      'scrollbars=yes'
    ].join(',');
  }

  private createState(): string {
    const random = Math.random().toString(36).slice(2);
    return `google-link:${Date.now()}:${random}`;
  }
}
