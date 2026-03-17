import { Component } from '@angular/core';
import { Header } from '../../shared/header/header';
import { HeroSection } from './components/hero-section/hero-section';
import { FeaturesSection } from './components/features-section/features-section';

@Component({
  selector: 'app-landing-page',
  imports: [
    Header,
    HeroSection,
    FeaturesSection
],
  templateUrl: './landing-page.html',
  styleUrl: './landing-page.css',
})
export class LandingPage {
}
