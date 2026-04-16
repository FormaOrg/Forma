import { Component } from '@angular/core';
import { Header } from '../../shared/header/header';
import { Footer } from '../../shared/footer/footer';
import { HeroSection } from './hero-section/hero-section';
import { FeaturesSection } from './components/features-section/features-section';
import { TemplatesShowcase } from './components/templates-showcase/templates-showcase';
import { DomainSection } from './components/domain-section/domain-section';
import { FaqSection } from './components/faq-section/faq-section';
import { MadeOnForma } from './components/made-on-forma/made-on-forma';
import { BuilderHelpDeck } from './components/builder-help-deck/builder-help-deck';
import { VisionCtaWave } from './components/vision-cta-wave/vision-cta-wave';
import { I18nService } from './i18n/i18n.service';

@Component({
  selector: 'app-landing-page',
  imports: [
    Header,
    HeroSection,
    FeaturesSection,
    TemplatesShowcase,
    DomainSection,
    FaqSection,
    MadeOnForma,
    BuilderHelpDeck,
    VisionCtaWave,
    Footer
],
  templateUrl: './landing-page.html',
  styleUrl: './landing-page.css',
})
export class LandingPage {
  constructor(private readonly i18n: I18nService) {
    void this.i18n.init();
  }
}
