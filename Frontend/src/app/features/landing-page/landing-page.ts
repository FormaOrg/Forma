import { Component } from '@angular/core';
import { Header } from '../../shared/header/header';
import { HeroSection } from './hero-section/hero-section';
import { FeaturesSection } from './components/features-section/features-section';
import { TemplatesShowcase } from './components/templates-showcase/templates-showcase';
import { DomainSection } from './components/domain-section/domain-section';
import { FaqSection } from './components/faq-section/faq-section';
import { MadeOnForma } from './components/made-on-forma/made-on-forma';

@Component({
  selector: 'app-landing-page',
  imports: [
    Header,
    HeroSection,
    FeaturesSection,
    TemplatesShowcase,
    DomainSection,
    FaqSection,
    MadeOnForma
],
  templateUrl: './landing-page.html',
  styleUrl: './landing-page.css',
})
export class LandingPage {
}
