import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../../../../landing-page/i18n/translate.pipe';

@Component({
  selector: 'app-greeting-section',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './greeting-section.html',
  styleUrl: './greeting-section.css',
})
export class GreetingSection {
  @Input() userName = 'Ismail';
}
