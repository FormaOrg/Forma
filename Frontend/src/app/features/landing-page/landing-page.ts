import { Component } from '@angular/core';
import { Header } from '../../shared/header/header';
import { HeroSection } from './components/hero-section/hero-section';
import { Section1 } from './components/first-section/section1';
import { TemplatesShowcase } from './components/templates-showcase/templates-showcase';

@Component({
  selector: 'app-landing-page',
  imports: [
    Header,
    HeroSection,
    Section1,
    TemplatesShowcase
  ],
  templateUrl: './landing-page.html',
  styleUrl: './landing-page.css',
})
export class LandingPage {
}
