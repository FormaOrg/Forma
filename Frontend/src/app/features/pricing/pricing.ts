import { Component } from '@angular/core';
import { Header } from '../../shared/header/header';
import { MainSection } from './components/main-section/main-section';
import { FeaturesSection } from './components/features-section/features-section';
import { StepsSection } from './components/steps-section/steps-section';

@Component({
  selector: 'app-pricing',
  imports: [
    Header,
    MainSection,
    FeaturesSection,
    StepsSection
  ],
  templateUrl: './pricing.html',
  styleUrl: './pricing.css',
})
export class Pricing {
}
