import { Component, signal } from '@angular/core';
import { LinkButton } from "../../../../../shared/components/link-button/link-button";

type TemplateItem = {
  image: string;
  alt: string;
  link: string;
};
 
type Category = {
  label: string;
  templates: TemplateItem[];
};

@Component({
  selector: 'app-ecommerce-templates-section',
  imports: [LinkButton],
  templateUrl: './templates-section.html',
  styleUrl: './templates-section.css',
})
export class TemplatesSection {
  readonly categories = signal<Category[]>([
    {
      label: 'Fashion & Clothing',
      templates: [
        { image: 'assets/Ecommerce Showcase/Templates/Fashion1.png', alt: 'Fashion & Clothing template 1', link: '#' },
        { image: 'assets/Ecommerce Showcase/Templates/Fashion2.png', alt: 'Fashion & Clothing template 2', link: '#' },
        { image: 'assets/Ecommerce Showcase/Templates/Fashion3.png', alt: 'Fashion & Clothing template 3', link: '#' },
      ]
    },
    {
      label: 'Jewelry & Accessories',
      templates: [
        { image: 'assets/Ecommerce Showcase/Templates/Accessories1.png', alt: 'Jewelry & Accessories template 1', link: '#' },
        { image: 'assets/Ecommerce Showcase/Templates/Accessories2.png', alt: 'Jewelry & Accessories template 2', link: '#' },
        { image: 'assets/Ecommerce Showcase/Templates/Accessories3.png', alt: 'Jewelry & Accessories template 3', link: '#' },
      ]
    },
    {
      label: 'Electronics',
      templates: [
        { image: 'assets/Ecommerce Showcase/Templates/Electronics1.png', alt: 'Electronics template 1', link: '#' },
        { image: 'assets/Ecommerce Showcase/Templates/Electronics2.png', alt: 'Electronics template 2', link: '#' },
        { image: 'assets/Ecommerce Showcase/Templates/Electronics3.png', alt: 'Electronics template 3', link: '#' },
      ]
    },
    {
      label: 'Food & Drinks',
      templates: [
        { image: 'assets/Ecommerce Showcase/Templates/Food1.png', alt: 'Food & Drinks template 1', link: '#' },
        { image: 'assets/Ecommerce Showcase/Templates/Food2.png', alt: 'Food & Drinks template 2', link: '#' },
        { image: 'assets/Ecommerce Showcase/Templates/Food3.png', alt: 'Food & Drinks template 3', link: '#' },
      ]
    },
    {
      label: 'Home & Decor',
      templates: [
        { image: 'assets/Ecommerce Showcase/Templates/Decor1.png', alt: 'Home & Decor template 1', link: '#' },
        { image: 'assets/Ecommerce Showcase/Templates/Decor2.png', alt: 'Home & Decor template 2', link: '#' },
        { image: 'assets/Ecommerce Showcase/Templates/Decor3.png', alt: 'Home & Decor template 3', link: '#' },
      ]
    },
  ]);
 
  readonly activeCategory = signal<string>('Fashion & Clothing');
 
  get activeTemplates(): TemplateItem[] {
    return this.categories().find(c => c.label === this.activeCategory())?.templates ?? [];
  }
 
  selectCategory(label: string): void {
    this.activeCategory.set(label);
  }
}
