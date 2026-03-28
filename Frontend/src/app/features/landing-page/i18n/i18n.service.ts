import { Injectable, signal } from '@angular/core';

type LocaleDict = Record<string, string>;

@Injectable({ providedIn: 'root' })
export class I18nService {
  readonly dict = signal<LocaleDict>({});
  readonly lang = signal<'en' | 'fr'>('en');

  async init(): Promise<void> {
    const preferred = (navigator.language || 'en').toLowerCase().startsWith('fr') ? 'fr' : 'en';
    await this.setLang(preferred);
  }

  async setLang(lang: 'en' | 'fr'): Promise<void> {
    if (this.lang() === lang && Object.keys(this.dict()).length > 0) return;
    this.lang.set(lang);
    this.dict.set(await this.loadLocale(lang));
  }

  t(key: string): string {
    return this.dict()[key] ?? key;
  }

  private async loadLocale(lang: 'en' | 'fr'): Promise<LocaleDict> {
    // Resolve against <base href> so it works on routed URLs and sub-path hosting.
    const url = new URL(`assets/locales/${lang}.json`, document.baseURI).toString();
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) return {};
    return (await res.json()) as LocaleDict;
  }
}

