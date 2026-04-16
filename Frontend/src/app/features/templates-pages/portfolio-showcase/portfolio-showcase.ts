import { Component } from '@angular/core';
import { Header } from "../../../shared/header/header";
import { Footer } from "../../../shared/footer/footer";
import { HeroSection } from "./components/hero-section/hero-section";
import { TemplatesSection } from './components/templates-section/templates-section';
import { StepsSection } from "./components/steps-section/steps-section";
import { StepsDisplaySection } from "./components/steps-display-section/steps-display-section";
import { MarketingSection } from "./components/marketing-section/marketing-section";
import { DomainSection } from "./components/domain-section/domain-section";
import { RevenueSection } from "./components/revenue-section/revenue-section";
import { ExamplesSection } from "./components/examples-section/examples-section";
import { FaqSection } from './components/faq-section/faq-section';
import { TypesSection } from "./components/types-section/types-section";
import { CtaSection } from "./components/cta-section/cta-section";

@Component({
  selector: 'app-portfolio-showcase',
  imports: [Header, Footer, HeroSection, TemplatesSection, StepsSection, StepsDisplaySection, MarketingSection, DomainSection, RevenueSection, ExamplesSection, FaqSection, TypesSection, CtaSection],
  templateUrl: './portfolio-showcase.html',
  styleUrl: './portfolio-showcase.css',
})
export class PortfolioShowcase {

}
