import { Component } from '@angular/core';
import { Header } from '../../shared/header/header';
import { MainSection } from './components/main-section/main-section';
import { FeaturesSection } from './components/features-section/features-section';

@Component({
  selector: 'app-pricing',
  imports: [
    Header,
    MainSection,
    FeaturesSection
  ],
  templateUrl: './pricing.html',
  styleUrl: './pricing.css',
})
export class Pricing {
}
