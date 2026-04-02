import { Injectable, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthResponse } from '../models/user.model';
import { AuthService } from './auth.service';

interface GoogleOauthConfigResponse {
  clientId: string;
  redirectUri: string;
}

interface GoogleAuthCodeRequest {
  code: string;
  redirectUri: string;
  rememberMe: boolean;
}

interface GoogleAuthPopupResult {
  state: string;
  success: boolean;
  response?: AuthResponse;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class GoogleAuthPopupService {
  private readonly popupTimeoutMs = 180000;
  private readonly messageType = 'forma-google-auth-result';
  private readonly channelName = 'forma-google-auth';
  private readonly contextKey = 'forma_google_popup_context';
  private readonly pendingAuthKey = 'forma_google_auth_pending_response';
  private readonly configUrl = `${environment.apiUrl}/auth/google/link-config`;
  private readonly exchangeUrl = `${environment.apiUrl}/auth/google/code`;
  private readonly stateKey = 'forma_google_auth_state';
  private readonly resultKey = 'forma_google_auth_result';
  private bridgeInitialized = false;
  private readonly handledStates = new Set<string>();

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router,
    private ngZone: NgZone
  ) {}

  initBridge(): void {
    if (this.bridgeInitialized) {
      return;
    }

    this.bridgeInitialized = true;

    window.addEventListener('storage', (event: StorageEvent) => {
      if (event.key !== this.resultKey || !event.newValue) {
        return;
      }

      const payload = this.parseResult(event.newValue);
      if (!payload) {
        return;
      }

      void this.ngZone.run(() => this.processPayload(payload));
    });

    window.addEventListener('message', (event: MessageEvent) => {
      if (event.origin !== window.location.origin) {
        return;
      }

      const payload = this.parseMessage(event.data);
      if (!payload) {
        return;
      }

      void this.ngZone.run(() => this.processPayload(payload));
    });

    this.createChannel()?.addEventListener('message', (event: MessageEvent<GoogleAuthPopupResult>) => {
      const payload = event.data;
      if (!payload) {
        return;
      }

      void this.ngZone.run(() => this.processPayload(payload));
    });

    const existingPayload = this.parseResult(localStorage.getItem(this.resultKey));
    if (existingPayload) {
      void this.ngZone.run(() => this.processPayload(existingPayload));
    }
  }

  async start(rememberMe: boolean, targetRoute: string): Promise<AuthResponse> {
    localStorage.removeItem(this.stateKey);
    localStorage.removeItem(this.resultKey);
    localStorage.removeItem(this.pendingAuthKey);
    localStorage.setItem(this.contextKey, JSON.stringify({
      apiUrl: environment.apiUrl,
      updatedAt: Date.now()
    }));

    const config = await firstValueFrom(
      this.http.get<GoogleOauthConfigResponse>(this.configUrl)
    );

    const state = this.createState(rememberMe, targetRoute);
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
      'forma-google-auth',
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

    if (!code || !state || !state.startsWith('google-auth:')) {
      this.consumePendingAuthResponse();
      return;
    }

    const expectedState = localStorage.getItem(this.stateKey);
    if (!expectedState || expectedState !== state) {
      this.finish(state, { success: false, message: 'Invalid Google sign-in state.' });
      return;
    }

    const rememberMe = this.extractRememberMe(state);
    const redirectUri = this.normalizeRedirectUri(currentUrl);

    try {
      const response = await firstValueFrom(
        this.http.post<AuthResponse>(this.exchangeUrl, {
          code,
          redirectUri,
          rememberMe
        } satisfies GoogleAuthCodeRequest)
      );

      this.finish(state, { success: true, response });
    } catch (error: any) {
      const message = error?.error?.message ?? 'Google sign-in failed. Please try again.';
      this.finish(state, { success: false, message });
    }
  }

  private waitForPopupResult(state: string, popup: Window): Promise<AuthResponse> {
    return new Promise<AuthResponse>((resolve, reject) => {
      const channel = this.createChannel();
      const cleanup = () => {
        window.removeEventListener('storage', onStorage);
        window.removeEventListener('message', onMessage);
        window.clearInterval(pollId);
        window.clearTimeout(timeoutId);
        channel?.close();
        localStorage.removeItem(this.resultKey);
      };

      const handlePayload = (payload: GoogleAuthPopupResult) => {
        cleanup();
        localStorage.removeItem(this.stateKey);

        this.ngZone.run(() => {
          if (!payload.success || !payload.response) {
            reject(new Error(payload.message ?? 'Google sign-in failed. Please try again.'));
            return;
          }

          this.authService.applyAuthResponse(payload.response, this.extractRememberMe(state));
          resolve(payload.response);
        });
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

      channel?.addEventListener('message', (event: MessageEvent<GoogleAuthPopupResult>) => {
        const payload = event.data;
        if (!payload || payload.state !== state) {
          return;
        }

        handlePayload(payload);
      });

      const timeoutId = window.setTimeout(() => {
        cleanup();
        localStorage.removeItem(this.stateKey);
        reject(new Error('Google sign-in timed out. Please try again.'));
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

  private finish(state: string, result: Omit<GoogleAuthPopupResult, 'state'>): void {
    localStorage.setItem(this.resultKey, JSON.stringify({ state, ...result }));
    localStorage.removeItem(this.stateKey);

    if (window.opener) {
      const targetRoute = this.prepareOpenerNavigation(state, result);
      this.createChannel()?.postMessage({ state, ...result });
      window.opener.postMessage(
        { type: this.messageType, payload: { state, ...result } },
        window.location.origin
      );
      if (targetRoute) {
        window.opener.location.assign(targetRoute);
      }
      window.close();
      return;
    }

    window.history.replaceState({}, '', '/login');
  }

  private normalizeRedirectUri(url: URL): string {
    return url.pathname === '/' ? url.origin : `${url.origin}${url.pathname}`;
  }

  private extractRememberMe(state: string): boolean {
    return state.split(':')[2] === '1';
  }

  private parseResult(value: string | null): GoogleAuthPopupResult | null {
    if (!value) {
      return null;
    }

    try {
      return JSON.parse(value) as GoogleAuthPopupResult;
    } catch {
      return null;
    }
  }

  private parseMessage(value: unknown): GoogleAuthPopupResult | null {
    if (
      typeof value !== 'object' ||
      value === null ||
      !('type' in value) ||
      (value as { type?: string }).type !== this.messageType ||
      !('payload' in value)
    ) {
      return null;
    }

    return (value as { payload: GoogleAuthPopupResult }).payload;
  }

  private createChannel(): BroadcastChannel | null {
    return typeof BroadcastChannel === 'undefined'
      ? null
      : new BroadcastChannel(this.channelName);
  }

  private createState(rememberMe: boolean, targetRoute: string): string {
    const random = Math.random().toString(36).slice(2);
    return `google-auth:${Date.now()}:${rememberMe ? '1' : '0'}:${encodeURIComponent(targetRoute)}:${random}`;
  }

  private extractTargetRoute(state: string): string {
    return decodeURIComponent(state.split(':')[3] ?? '/app/home');
  }

  private prepareOpenerNavigation(state: string, result: Omit<GoogleAuthPopupResult, 'state'>): string | null {
    if (!result.success || !result.response) {
      return '/login';
    }

    if (result.response.requiresLoginVerification && result.response.loginVerificationToken) {
      this.authService.savePendingLoginVerification({
        token: result.response.loginVerificationToken,
        email: result.response.user.email,
        message: result.response.message,
        rememberMe: this.extractRememberMe(state),
        returnUrl: this.extractTargetRoute(state)
      });

      const returnUrl = this.extractTargetRoute(state);
      return returnUrl
        ? `/login-verification?returnUrl=${encodeURIComponent(returnUrl)}`
        : '/login-verification';
    }

    localStorage.setItem(this.pendingAuthKey, JSON.stringify({
      response: result.response,
      rememberMe: this.extractRememberMe(state)
    }));
    return this.extractTargetRoute(state);
  }

  private consumePendingAuthResponse(): void {
    const stored = localStorage.getItem(this.pendingAuthKey);
    if (!stored) {
      return;
    }

    try {
      const payload = JSON.parse(stored) as {
        response: AuthResponse;
        rememberMe: boolean;
      };
      this.authService.applyAuthResponse(payload.response, payload.rememberMe);
    } finally {
      localStorage.removeItem(this.pendingAuthKey);
    }
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

  private async processPayload(payload: GoogleAuthPopupResult): Promise<void> {
    if (this.handledStates.has(payload.state)) {
      return;
    }

    this.handledStates.add(payload.state);

    if (!payload.success || !payload.response) {
      return;
    }

    const rememberMe = this.extractRememberMe(payload.state);
    const targetRoute = this.extractTargetRoute(payload.state);

    if (payload.response.requiresLoginVerification && payload.response.loginVerificationToken) {
      this.authService.savePendingLoginVerification({
        token: payload.response.loginVerificationToken,
        email: payload.response.user.email,
        message: payload.response.message,
        rememberMe,
        returnUrl: targetRoute
      });
      localStorage.removeItem(this.resultKey);
      await this.router.navigate(['/login-verification'], {
        queryParams: { returnUrl: targetRoute }
      });
      return;
    }

    this.authService.applyAuthResponse(payload.response, rememberMe);
    localStorage.removeItem(this.resultKey);
    await this.router.navigateByUrl(targetRoute);
  }
}
