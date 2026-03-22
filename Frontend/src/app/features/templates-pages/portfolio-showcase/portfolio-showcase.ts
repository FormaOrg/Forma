import { Component } from '@angular/core';
import { Header } from "../../../shared/header/header";
import { Footer } from "../../../shared/footer/footer";
import { HeroSection } from "./components/hero-section/hero-section";
import { TemplatesSection } from './components/templates-section/templates-section';
import { StepsSection } from "./components/steps-section/steps-section";
import { StepsDisplaySection } from "./components/steps-display-section/steps-display-section";

@Component({
  selector: 'app-portfolio-showcase',
  imports: [Header, Footer, HeroSection, TemplatesSection, StepsSection, StepsDisplaySection],
  templateUrl: './portfolio-showcase.html',
  styleUrl: './portfolio-showcase.css',
})
export class PortfolioShowcase {

}
