import { Component } from '@angular/core';
import { Header } from '../../shared/header/header';
import { Footer } from '../../shared/footer/footer';
import { FormaProcessShowcaseComponent } from './components/forma-process-showcase/forma-process-showcase';
import { ManualDesignSection } from './components/manual-design-section/manual-design-section';
import { FormaOverview } from './components/forma-overview/forma-overview';
import { TemplateSection } from './components/template-section/template-section';
import { CustomizerSectionComponent } from './components/customizer-section/customizer-section';
import { ParallaxSection } from './components/parallax-section/parallax-section';
import { StepsSection2 } from './components/steps-section/steps-section';
import { ProductHelpDeck } from './components/builder-help-deck/builder-help-deck';
import { ProductVisionCtaWave } from './components/vision-cta-wave/vision-cta-wave';

@Component({
  selector: 'app-product',
  imports: [
    Header,
    FormaProcessShowcaseComponent,
    FormaOverview,
    ManualDesignSection,
    TemplateSection,
    CustomizerSectionComponent,
    ParallaxSection,
    StepsSection2,
    ProductHelpDeck,
    ProductVisionCtaWave,
    Footer
  ],
  templateUrl: './product.html',
  styleUrl: './product.css',
})
export class Product {

}
