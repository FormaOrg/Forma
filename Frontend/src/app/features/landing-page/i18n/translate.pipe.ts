import { ChangeDetectorRef, Pipe, PipeTransform, effect } from '@angular/core';
import { I18nService } from './i18n.service';

@Pipe({
  name: 't',
  standalone: true,
  pure: false,
})
export class TranslatePipe implements PipeTransform {
  constructor(
    private readonly i18n: I18nService,
    private readonly cdr: ChangeDetectorRef,
  ) {
    // Ensure async locale load triggers template refresh (incl. zoneless setups).
    effect(() => {
      void this.i18n.lang();
      void this.i18n.dict();
      this.cdr.markForCheck();
    });
  }

  transform(key: string): string {
    return this.i18n.t(key);
  }
}

