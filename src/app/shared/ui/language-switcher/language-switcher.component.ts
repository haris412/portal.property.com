import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';
import { map, startWith } from 'rxjs';
import { LanguageService, SupportedLang } from '../../../core/services/language.service';

const LANG_LABELS: Record<SupportedLang, string> = {
  en: 'EN',
  ur: 'اردو',
};

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  templateUrl: './language-switcher.component.html',
  styleUrl: './language-switcher.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LanguageSwitcherComponent {
  private readonly languageService = inject(LanguageService);
  private readonly translate        = inject(TranslateService);

  readonly langs     = this.languageService.supportedLangs;
  readonly langLabels = LANG_LABELS;

  readonly currentLang = toSignal(
    this.translate.onLangChange.pipe(
      map((e) => e.lang as SupportedLang),
      startWith(this.languageService.getCurrentLang()),
    ),
    { initialValue: this.languageService.getCurrentLang() },
  );

  setLang(lang: SupportedLang): void {
    this.languageService.setLang(lang);
  }

  isActive(lang: SupportedLang): boolean {
    return this.currentLang() === lang;
  }
}
