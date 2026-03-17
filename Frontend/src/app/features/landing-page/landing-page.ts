import { Component } from '@angular/core';
import { Header } from '../../shared/header/header';
import { HeroSection } from './hero-section/hero-section';
import { FeaturesSection } from './components/features-section/features-section';
import { DomainSection } from './components/domain-section/domain-section';
import { FaqSection } from './components/faq-section/faq-section';

@Component({
  selector: 'app-landing-page',
  imports: [
    Header,
    HeroSection,
    FeaturesSection,
    DomainSection,
    FaqSection
],
  templateUrl: './landing-page.html',
  styleUrl: './landing-page.css',
})
export class LandingPage {
}
