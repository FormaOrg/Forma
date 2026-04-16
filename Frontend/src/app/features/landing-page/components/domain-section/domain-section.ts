import { Component } from '@angular/core';
import { TranslatePipe } from '../../i18n/translate.pipe';

@Component({
  selector: 'app-landing-page-domain-section',
  imports: [TranslatePipe],
  templateUrl: './domain-section.html',
  styleUrl: './domain-section.css',
})
export class DomainSection {

}
