
import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild } from '@angular/core';

type TemplateItem = {
    category: string,
    image: string
}

@Component({
    selector: 'app-templates-showcase',
    standalone: true,
    imports: [
        CommonModule
    ],
    templateUrl: './templates-showcase.html',
    styleUrl: './templates-showcase.css'
})
export class TemplatesShowcase {
    @ViewChild('slider', {static: false})
    slider?: ElementRef<HTMLDivElement>;

    templates: TemplateItem[] = [
        { category: 'eCommerce', image: 'assets/Landing Page/templates/ecom.avif' },
        { category: 'portfolio', image: 'assets/Landing Page/templates/portfolio.avif' },
        { category: 'Business', image: 'assets/Landing Page/templates/business.avif' },
        { category: 'Landing page', image: 'assets/Landing Page/templates/landingPage.avif' },
        { category: 'Blog', image: 'assets/Landing Page/templates/blog.avif' },
        { category: 'Industrial', image: 'assets/Landing Page/templates/industrial.avif' },
        { category: 'Events', image: 'assets/Landing Page/templates/events.avif' }
    ];

}