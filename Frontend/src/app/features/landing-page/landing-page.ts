import { Component } from '@angular/core';
import { Header } from '../../shared/header/header';
import { HeroSection } from './hero-section/hero-section';
import { Section1 } from './section1/section1';

@Component({
  selector: 'app-landing-page',
  imports: [
    Header,
    HeroSection,
    Section1
  ],
  templateUrl: './landing-page.html',
  styleUrl: './landing-page.css',
})
export class LandingPage {
}
