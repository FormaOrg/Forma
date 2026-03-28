import { Component } from '@angular/core';
import { Header } from "../../../shared/header/header";
import { Footer } from "../../../shared/footer/footer";
import { HeroSection } from './components/hero-section/hero-section';
import { StorefrontSection } from './components/storefront-section/storefront-section';
import { TemplatesSection } from './components/templates-section/templates-section';
import { ProductsSection } from "./components/products-section/products-section";
import { DomainSection } from "./components/domain-section/domain-section";
import { SellEverywhereSection } from "./components/sell-everywhere-section/sell-everywhere-section";
import { DashboardControlSection } from './components/dashboard-control-section/dashboard-control-section';
import { SupportSection } from "./components/support-section/support-section";
import { FaqSection } from "./components/faq-section/faq-section";
import { CtaSection } from "./components/cta-section/cta-section";

@Component({
  selector: 'app-ecommerce-showcase',
  imports: [Header, Footer, HeroSection, StorefrontSection, TemplatesSection, ProductsSection, DomainSection, SellEverywhereSection, DashboardControlSection, SupportSection, FaqSection, CtaSection],
  templateUrl: './ecommerce-showcase.html',
  styleUrl: './ecommerce-showcase.css',
})
export class EcommerceShowcase {

}
