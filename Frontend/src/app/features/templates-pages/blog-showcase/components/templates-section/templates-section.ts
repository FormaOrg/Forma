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
  selector: 'app-templates-section',
  imports: [LinkButton],
  templateUrl: './templates-section.html',
  styleUrl: './templates-section.css',
})
export class TemplatesSection {
  readonly categories = signal<Category[]>([
    {
      label: 'Personal Blog',
      templates: [
        { image: 'assets/Blog Showcase/Templates/personal1.png', alt: 'Personal blog template 1', link: '#' },
        { image: 'assets/Blog Showcase/Templates/personal2.png', alt: 'Personal blog template 2', link: '#' },
        { image: 'assets/Blog Showcase/Templates/personal3.png', alt: 'Personal blog template 3', link: '#' },
      ]
    },
    {
      label: 'Food & Travel',
      templates: [
        { image: 'assets/Blog Showcase/Templates/food1.png', alt: 'Food & travel template 1', link: '#' },
        { image: 'assets/Blog Showcase/Templates/food2.png', alt: 'Food & travel template 2', link: '#' },
        { image: 'assets/Blog Showcase/Templates/food3.png', alt: 'Food & travel template 3', link: '#' },
      ]
    },
    {
      label: 'News & Business',
      templates: [
        { image: 'assets/Blog Showcase/Templates/news1.png', alt: 'News & business template 1', link: '#' },
        { image: 'assets/Blog Showcase/Templates/news2.png', alt: 'News & business template 2', link: '#' },
        { image: 'assets/Blog Showcase/Templates/news3.png', alt: 'News & business template 3', link: '#' },
      ]
    },
    {
      label: 'Arts',
      templates: [
        { image: 'assets/Blog Showcase/Templates/arts1.png', alt: 'Arts template 1', link: '#' },
        { image: 'assets/Blog Showcase/Templates/arts2.png', alt: 'Arts template 2', link: '#' },
        { image: 'assets/Blog Showcase/Templates/arts3.png', alt: 'Arts template 3', link: '#' },
      ]
    },
    {
      label: 'Podcast',
      templates: [
        { image: 'assets/Blog Showcase/Templates/podcast1.png', alt: 'Podcast template 1', link: '#' },
        { image: 'assets/Blog Showcase/Templates/podcast2.png', alt: 'Podcast template 2', link: '#' },
        { image: 'assets/Blog Showcase/Templates/podcast3.png', alt: 'Podcast template 3', link: '#' },
      ]
    },
  ]);
 
  readonly activeCategory = signal<string>('Personal Blog');
 
  get activeTemplates(): TemplateItem[] {
    return this.categories().find(c => c.label === this.activeCategory())?.templates ?? [];
  }
 
  selectCategory(label: string): void {
    this.activeCategory.set(label);
  }
}
