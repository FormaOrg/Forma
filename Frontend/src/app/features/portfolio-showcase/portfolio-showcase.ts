import { Component } from '@angular/core';
import { Header } from "../../shared/header/header";
import { Footer } from "../../shared/footer/footer";
import { HeroSection } from "./components/hero-section/hero-section";

@Component({
  selector: 'app-portfolio-showcase',
  imports: [Header, Footer, HeroSection],
  templateUrl: './portfolio-showcase.html',
  styleUrl: './portfolio-showcase.css',
})
export class PortfolioShowcase {

}
