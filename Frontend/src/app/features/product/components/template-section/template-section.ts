import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild } from '@angular/core';

type TemplateItem = {
  category: string;
  image: string;
};

@Component({
  selector: 'app-template-section',
  imports: [CommonModule],
  templateUrl: './template-section.html',
  styleUrl: './template-section.css',
})
export class TemplateSection {
  @ViewChild('slider', { static: false })
  slider?: ElementRef<HTMLDivElement>;

  templates: TemplateItem[] = [
    { category: 'eCommerce', image: 'assets/Landing Page/templates/ecom.avif' },
    { category: 'Portfolio', image: 'assets/Landing Page/templates/portfolio.avif' },
    { category: 'Business', image: 'assets/Landing Page/templates/business.avif' },
    { category: 'Landing Page', image: 'assets/Landing Page/templates/landingPage.avif' },
    { category: 'Blog', image: 'assets/Landing Page/templates/blog.avif' },
    { category: 'Industrial', image: 'assets/Landing Page/templates/industrial.avif' },
    { category: 'Events', image: 'assets/Landing Page/templates/events.avif' },
  ];
}