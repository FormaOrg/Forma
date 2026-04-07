import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

declare global {
  interface Window {
    __FORMA_SKIP_BOOTSTRAP__?: boolean;
  }
}

if (!window.__FORMA_SKIP_BOOTSTRAP__) {
  bootstrapApplication(App, appConfig)
    .then(() => {
      requestAnimationFrame(() => {
        document.documentElement.classList.add('forma-app-ready');
      });
    })
    .catch((err) => console.error(err));
}
