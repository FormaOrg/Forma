import { Component } from '@angular/core';
import { Header } from "../../../shared/header/header";
import { Footer } from "../../../shared/footer/footer";
import { FaqSection } from "./components/faq-section/faq-section";
import { CtaSection } from "./components/cta-section/cta-section";
import { TemplatesSection } from "./components/templates-section/templates-section";
import { StepsSection } from './components/steps-section/steps-section';
import { HeroSection } from './components/hero-section/hero-section';
import { FeatureHighlightSection } from './components/feature-highlight-section/feature-highlight-section';
import { EfficiencySection } from "./components/efficiency-section/efficiency-section";

@Component({
  selector: 'app-blog-showcase',
  imports: [Header, Footer, HeroSection, FaqSection, CtaSection, TemplatesSection, StepsSection, FeatureHighlightSection, EfficiencySection],
  templateUrl: './blog-showcase.html',
  styleUrl: './blog-showcase.css',
})
export class BlogShowcase {

}
