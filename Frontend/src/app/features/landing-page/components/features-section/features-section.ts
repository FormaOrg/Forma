import { Component } from '@angular/core';
import { LinkButton } from "../../../../shared/components/link-button/link-button";
import { TranslatePipe } from '../../i18n/translate.pipe';

@Component({
  selector: 'app-landing-page-features-section',
  imports: [LinkButton, TranslatePipe],
  templateUrl: './features-section.html',
  styleUrl: './features-section.css',
})
export class FeaturesSection {

}
