import { Component } from '@angular/core';
import { Header } from '../../shared/header/header';
import { MainSection } from './components/main-section/main-section';
import { FeaturesSection } from './components/features-section/features-section';
import { StepsSection } from './components/steps-section/steps-section';
import { BuilderHelpDeck } from './components/builder-help-deck/builder-help-deck';
import { VisionCtaWave } from './components/vision-cta-wave/vision-cta-wave';
import { Footer } from '../../shared/footer/footer';

@Component({
  selector: 'app-pricing',
  imports: [
    Header,
    MainSection,
    FeaturesSection,
    StepsSection,
    BuilderHelpDeck,
    VisionCtaWave,
    Footer
  ],
  templateUrl: './pricing.html',
  styleUrl: './pricing.css',
})
export class Pricing {
}
