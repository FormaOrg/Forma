import { Injectable, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { GoogleClientConfigResponse } from '../models/user.model';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize(config: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
            use_fedcm_for_prompt?: boolean;
          }): void;
          cancel(): void;
          prompt(): void;
          renderButton(
            parent: HTMLElement,
            options: {
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
              shape?: 'rectangular' | 'pill' | 'circle' | 'square';
              width?: number;
              logo_alignment?: 'left' | 'center';
              locale?: string;
            }
          ): void;
        };
      };
    };
  }
}

@Injectable({ providedIn: 'root' })
export class GoogleIdentityService {
  private readonly configUrl = `${environment.apiUrl}/auth/google/config`;
  private clientIdPromise: Promise<string> | null = null;
  private scriptPromise: Promise<void> | null = null;
  private initializePromise: Promise<void> | null = null;
  private activeCallback: ((credential: string) => void) | null = null;

  constructor(
    private http: HttpClient,
    private ngZone: NgZone
  ) {}

  async renderButton(
    container: HTMLElement,
    callback: (credential: string) => void,
    text: 'signin_with' | 'signup_with' | 'continue_with' = 'continue_with'
  ): Promise<void> {
    await this.ensureInitialized(callback);

    container.innerHTML = '';
    const googleIdentity = window.google?.accounts?.id;
    if (!googleIdentity) {
      throw new Error('Google Identity Services did not load correctly.');
    }

    googleIdentity.renderButton(container, {
      theme: 'outline',
      size: 'large',
      text,
      shape: 'rectangular',
      width: container.clientWidth || 260,
      logo_alignment: 'left',
      locale: 'en'
    });
  }

  cancel(): void {
    window.google?.accounts?.id?.cancel();
  }

  async prompt(
    callback: (credential: string) => void
  ): Promise<void> {
    await this.ensureInitialized(callback);

    const googleIdentity = window.google?.accounts?.id;
    if (!googleIdentity) {
      throw new Error('Google Identity Services did not load correctly.');
    }

    googleIdentity.prompt();
  }

  private async ensureInitialized(
    callback: (credential: string) => void
  ): Promise<void> {
    this.activeCallback = callback;

    if (this.initializePromise) {
      await this.initializePromise;
      return;
    }

    this.initializePromise = (async () => {
      const clientId = await this.getClientId();
      await this.loadScript();

      if (!window.google?.accounts?.id) {
        throw new Error('Google Identity Services did not load correctly.');
      }

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: ({ credential }) => {
          if (credential && this.activeCallback) {
            this.ngZone.run(() => this.activeCallback?.(credential));
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
        use_fedcm_for_prompt: true
      });
    })();

    try {
      await this.initializePromise;
    } catch (error) {
      this.initializePromise = null;
      throw error;
    }
  }

  private getClientId(): Promise<string> {
    if (!this.clientIdPromise) {
      this.clientIdPromise = firstValueFrom(
        this.http.get<GoogleClientConfigResponse>(this.configUrl)
      ).then(response => response.clientId);
    }

    return this.clientIdPromise;
  }

  private loadScript(): Promise<void> {
    if (window.google?.accounts?.id) {
      return Promise.resolve();
    }

    if (!this.scriptPromise) {
      this.scriptPromise = new Promise<void>((resolve, reject) => {
        const existing = document.querySelector<HTMLScriptElement>(
          'script[src="https://accounts.google.com/gsi/client"]'
        );

        if (existing) {
          existing.addEventListener('load', () => resolve(), { once: true });
          existing.addEventListener('error', () => reject(new Error('Failed to load Google Identity Services.')), { once: true });
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client?hl=en';
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Google Identity Services.'));
        document.head.appendChild(script);
      });
    }

    return this.scriptPromise;
  }
}
