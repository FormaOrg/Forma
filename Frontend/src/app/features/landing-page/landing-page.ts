import { Component } from '@angular/core';
import { Header } from '../../shared/header/header';
import { HeroSection } from './hero-section/hero-section';
import { FeaturesSection } from './features-section/features-section';

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
