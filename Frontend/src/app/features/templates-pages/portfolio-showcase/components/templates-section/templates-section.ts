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
      label: 'Architecture',
      templates: [
        { image: 'assets/Portfolio Website Gallery/Templates/Arch1.jpg', alt: 'Architecture template 1', link: "#" },
        { image: 'assets/Portfolio Website Gallery/Templates/Arch2.jpg', alt: 'Architecture template 2', link: "#" },
        { image: 'assets/Portfolio Website Gallery/Templates/Arch3.jpg', alt: 'Architecture template 3', link: "#" },
      ]
    },
    {
      label: 'Art',
      templates: [
        { image: 'assets/Portfolio Website Gallery/Templates/Art1.jpg', alt: 'Art template 1', link: "#" },
        { image: 'assets/Portfolio Website Gallery/Templates/Art2.jpg', alt: 'Art template 2', link: "#" },
        { image: 'assets/Portfolio Website Gallery/Templates/Art3.jpg', alt: 'Art template 3', link: "#" },
      ]
    },
    {
      label: 'Illustration',
      templates: [
        { image: 'assets/Portfolio Website Gallery/Templates/Illus1.jpg', alt: 'Illustration template 1', link: "#" },
        { image: 'assets/Portfolio Website Gallery/Templates/Illus2.jpg', alt: 'Illustration template 2', link: "#" },
        { image: 'assets/Portfolio Website Gallery/Templates/Illus3.jpg', alt: 'Illustration template 3', link: "#" },
      ]
    },
    {
      label: 'Music',
      templates: [
        { image: 'assets/Portfolio Website Gallery/Templates/Model1.jpg', alt: 'Music template 1', link: "#" },
        { image: 'assets/Portfolio Website Gallery/Templates/Model2.jpg', alt: 'Music template 2', link: "#" },
        { image: 'assets/Portfolio Website Gallery/Templates/Model3.jpg', alt: 'Music template 3', link: "#" },
      ]
    },
    {
      label: 'Model',
      templates: [
        { image: 'assets/Portfolio Website Gallery/Templates/Music1.jpg', alt: 'Model template 1', link: "#" },
        { image: 'assets/Portfolio Website Gallery/Templates/Music2.jpg', alt: 'Model template 2', link: "#" },
        { image: 'assets/Portfolio Website Gallery/Templates/Music3.jpg', alt: 'Model template 3', link: "#" },
      ]
    },
    {
      label: 'Photography',
      templates: [
        { image: 'assets/Portfolio Website Gallery/Templates/Photography1.jpg', alt: 'Photography template 1', link: "#" },
        { image: 'assets/Portfolio Website Gallery/Templates/Photography2.jpg', alt: 'Photography template 2', link: "#" },
        { image: 'assets/Portfolio Website Gallery/Templates/Photography3.jpg', alt: 'Photography template 3', link: "#" },
      ]
    },
  ]);
 
  readonly activeCategory = signal<string>('Architecture');
 
  get activeTemplates(): TemplateItem[] {
    return this.categories().find(c => c.label === this.activeCategory())?.templates ?? [];
  }
 
  selectCategory(label: string): void {
    this.activeCategory.set(label);
  }
}
