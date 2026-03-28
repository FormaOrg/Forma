import { Component } from '@angular/core';
import { LinkButton } from '../../../../shared/components/link-button/link-button';
import { TranslatePipe } from '../../i18n/translate.pipe';

@Component({
  selector: 'app-landing-page-hero-section',
  imports: [LinkButton, TranslatePipe],
  templateUrl: './hero-section.html',
  styleUrl: './hero-section.css',
})
export class HeroSection {

}
