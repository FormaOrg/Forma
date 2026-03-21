import { Component } from '@angular/core';
import { Header } from '../../../shared/header/header';
import { FaqsHeroSection } from './components/faqs-hero-section/faqs-hero-section';
import { Footer } from '../../../shared/footer/footer';
import { HeroSection } from "../../template-gallery/components/hero-section/hero-section";
import { PopularQuestions } from './components/popular-questions/popular-questions';
import { FaqCategoriesSection } from './components/faq-categories-section/faq-categories-section';
import { FaqDetailsSection } from './components/faq-details-section/faq-details-section';
import { FaqSupportBanner } from './components/faq-support-banner/faq-support-banner';

@Component({
  selector: 'app-faqs',
  imports: [
    Header,
    FaqsHeroSection,
    PopularQuestions,
    FaqCategoriesSection,
    FaqDetailsSection,
    FaqSupportBanner,
    Footer
],
  templateUrl: './faqs.html',
  styleUrl: './faqs.css',
})
export class Faqs {

}
