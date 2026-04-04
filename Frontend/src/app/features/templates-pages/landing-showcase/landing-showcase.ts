import { Component } from '@angular/core';

import { Footer } from '../../../shared/footer/footer';
import { Header } from '../../../shared/header/header';
import { ProductHelpDeck } from '../../product/components/builder-help-deck/builder-help-deck';
import { CustomizerSectionComponent } from '../../product/components/customizer-section/customizer-section';
import { FormaOverview } from '../../product/components/forma-overview/forma-overview';
import { FormaProcessShowcaseComponent } from '../../product/components/forma-process-showcase/forma-process-showcase';
import { ManualDesignSection } from '../../product/components/manual-design-section/manual-design-section';
import { ParallaxSection } from '../../product/components/parallax-section/parallax-section';
import { StepsSection2 } from '../../product/components/steps-section/steps-section';
import { TemplateSection } from '../../product/components/template-section/template-section';
import { ProductVisionCtaWave } from '../../product/components/vision-cta-wave/vision-cta-wave';

@Component({
  selector: 'app-landing-showcase',
  imports: [
    Header,
    FormaProcessShowcaseComponent,
    FormaOverview,
    ManualDesignSection,
    TemplateSection,
    CustomizerSectionComponent,
    StepsSection2,
    ParallaxSection,
    ProductHelpDeck,
    ProductVisionCtaWave,
    Footer,
  ],
  templateUrl: './landing-showcase.html',
  styleUrl: './landing-showcase.css',
})
export class LandingShowcase {}
