import {
  ApplicationConfig,
  APP_INITIALIZER,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection
} from '@angular/core';
import { RouteReuseStrategy } from '@angular/router';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import {
  provideHttpClient,
  withInterceptorsFromDi,
  HTTP_INTERCEPTORS
} from '@angular/common/http';

import { routes } from './app.routes';
import { JwtInterceptor } from './core/interceptors/jwt.interceptor';
import { I18nService } from './features/landing-page/i18n/i18n.service';
import { SettingsRouteReuseStrategy } from './core/routing/settings-route-reuse.strategy';
import { ThemeService } from './core/services/theme.service';
import { GoogleLinkOauthService } from './core/services/google-link-oauth.service';
import { GoogleAuthPopupService } from './core/services/google-auth-popup.service';
import { SettingsNavigationService } from './core/services/settings-navigation.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),

    provideRouter(
      routes,
      withInMemoryScrolling({
        scrollPositionRestoration: 'top',
        anchorScrolling: 'enabled'
      })
    ),

    provideHttpClient(withInterceptorsFromDi()),

    {
      provide: HTTP_INTERCEPTORS,
      useClass: JwtInterceptor,
      multi: true
    },
    {
      provide: APP_INITIALIZER,
      multi: true,
      useFactory: (i18n: I18nService) => () => i18n.init(),
      deps: [I18nService]
    },
    {
      provide: APP_INITIALIZER,
      multi: true,
      useFactory: (themeService: ThemeService) => () => themeService.init(),
      deps: [ThemeService]
    },
    {
      provide: APP_INITIALIZER,
      multi: true,
      useFactory: (googleLinkOauthService: GoogleLinkOauthService) => () => googleLinkOauthService.handleCallbackIfPresent(),
      deps: [GoogleLinkOauthService]
    },
    {
      provide: APP_INITIALIZER,
      multi: true,
      useFactory: (googleAuthPopupService: GoogleAuthPopupService) => () => googleAuthPopupService.handleCallbackIfPresent(),
      deps: [GoogleAuthPopupService]
    },
    {
      provide: APP_INITIALIZER,
      multi: true,
      useFactory: (googleAuthPopupService: GoogleAuthPopupService) => () => googleAuthPopupService.initBridge(),
      deps: [GoogleAuthPopupService]
    },
    {
      provide: APP_INITIALIZER,
      multi: true,
      useFactory: (settingsNavigationService: SettingsNavigationService) => () => settingsNavigationService.init(),
      deps: [SettingsNavigationService]
    },
    {
      provide: RouteReuseStrategy,
      useClass: SettingsRouteReuseStrategy
    }
  ]
};
