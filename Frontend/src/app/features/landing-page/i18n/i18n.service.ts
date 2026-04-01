import { Injectable, signal } from '@angular/core';

type LocaleDict = Record<string, string>;
export type AppLanguage = 'en' | 'fr';

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly langStorageKey = 'forma_lang';
  readonly dict = signal<LocaleDict>({});
  readonly lang = signal<AppLanguage>('en');

  async init(): Promise<void> {
    const saved = this.readSavedLang();
    const preferred = saved ?? ((navigator.language || 'en').toLowerCase().startsWith('fr') ? 'fr' : 'en');
    await this.setLang(preferred);
  }

  async setLang(lang: AppLanguage): Promise<void> {
    if (this.lang() === lang && Object.keys(this.dict()).length > 0) return;
    localStorage.setItem(this.langStorageKey, lang);
    this.lang.set(lang);
    document.documentElement.lang = lang;
    this.dict.set(await this.loadLocale(lang));
  }

  t(key: string): string {
    return this.dict()[key] ?? key;
  }

  private async loadLocale(lang: AppLanguage): Promise<LocaleDict> {
    const [baseLocale, appLocale] = await Promise.all([
      this.fetchLocaleFile(`assets/locales/${lang}.json`),
      this.fetchLocaleFile(`assets/locales/app.${lang}.json`)
    ]);

    return {
      ...baseLocale,
      ...appLocale
    };
  }

  private readSavedLang(): AppLanguage | null {
    const saved = localStorage.getItem(this.langStorageKey);
    return saved === 'fr' ? 'fr' : saved === 'en' ? 'en' : null;
  }

  private async fetchLocaleFile(path: string): Promise<LocaleDict> {
    const url = new URL(path, document.baseURI).toString();
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) return {};
    return (await res.json()) as LocaleDict;
  }
}

