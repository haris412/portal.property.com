import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export type SupportedLang = 'en' | 'ur';

const LANG_STORAGE_KEY = 'appLang';
const DEFAULT_LANG: SupportedLang = 'en';
const RTL_LANGS: SupportedLang[] = ['ur'];

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly translate = inject(TranslateService);

  readonly supportedLangs: SupportedLang[] = ['en', 'ur'];

  /** Call once at app startup (app.ts constructor). */
  init(): void {
    const saved = (localStorage.getItem(LANG_STORAGE_KEY) as SupportedLang | null) ?? DEFAULT_LANG;
    const lang  = this.supportedLangs.includes(saved) ? saved : DEFAULT_LANG;
    this.translate.addLangs(this.supportedLangs);
    this.translate.setDefaultLang(DEFAULT_LANG);
    this.applyLang(lang);
  }

  setLang(lang: SupportedLang): void {
    localStorage.setItem(LANG_STORAGE_KEY, lang);
    this.applyLang(lang);
  }

  getCurrentLang(): SupportedLang {
    return (this.translate.currentLang as SupportedLang) ?? DEFAULT_LANG;
  }

  isRtl(): boolean {
    return RTL_LANGS.includes(this.getCurrentLang());
  }

  // ── Private ──────────────────────────────────────────────────────────────────

  private applyLang(lang: SupportedLang): void {
    this.translate.use(lang);
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', RTL_LANGS.includes(lang) ? 'rtl' : 'ltr');
  }
}
