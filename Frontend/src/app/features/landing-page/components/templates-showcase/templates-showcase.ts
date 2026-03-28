
import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { LinkButton } from "../../../../shared/components/link-button/link-button";
import { TranslatePipe } from '../../i18n/translate.pipe';

type TemplateItem = {
    categoryKey: string,
    image: string
}

@Component({
    selector: 'app-landing-page-templates-showcase',
    standalone: true,
    imports: [
    CommonModule,
    LinkButton,
    TranslatePipe
],
    templateUrl: './templates-showcase.html',
    styleUrls: ['./templates-showcase.css']
})
export class TemplatesShowcase {
    @ViewChild('slider', {static: false})
    slider?: ElementRef<HTMLDivElement>;

    templates: TemplateItem[] = [
        { categoryKey: 'landing.templates.categories.ecommerce', image: 'assets/Landing Page/templates/ecom.avif' },
        { categoryKey: 'landing.templates.categories.portfolio', image: 'assets/Landing Page/templates/portfolio.avif' },
        { categoryKey: 'landing.templates.categories.business', image: 'assets/Landing Page/templates/business.avif' },
        { categoryKey: 'landing.templates.categories.landingPage', image: 'assets/Landing Page/templates/landingPage.avif' },
        { categoryKey: 'landing.templates.categories.blog', image: 'assets/Landing Page/templates/blog.avif' },
        { categoryKey: 'landing.templates.categories.industrial', image: 'assets/Landing Page/templates/industrial.avif' },
        { categoryKey: 'landing.templates.categories.events', image: 'assets/Landing Page/templates/events.avif' }
    ];

}