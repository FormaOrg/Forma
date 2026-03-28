import { Component } from '@angular/core';
import { LinkButton } from "../../../../shared/components/link-button/link-button";
import { TranslatePipe } from '../../i18n/translate.pipe';

@Component({
  selector: 'app-landing-page-vision-cta-wave',
  imports: [LinkButton, TranslatePipe],
  templateUrl: './vision-cta-wave.html',
  styleUrl: './vision-cta-wave.css',
})
export class VisionCtaWave {

}
