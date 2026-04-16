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
        { image: 'assets/Portfolio Website Gallery/Templates/Arch1.avif', alt: 'Architecture template 1', link: "#" },
        { image: 'assets/Portfolio Website Gallery/Templates/Arch2.avif', alt: 'Architecture template 2', link: "#" },
        { image: 'assets/Portfolio Website Gallery/Templates/Arch3.avif', alt: 'Architecture template 3', link: "#" },
      ]
    },
    {
      label: 'Art',
      templates: [
        { image: 'assets/Portfolio Website Gallery/Templates/Art1.avif', alt: 'Art template 1', link: "#" },
        { image: 'assets/Portfolio Website Gallery/Templates/Art2.avif', alt: 'Art template 2', link: "#" },
        { image: 'assets/Portfolio Website Gallery/Templates/Art3.avif', alt: 'Art template 3', link: "#" },
      ]
    },
    {
      label: 'Illustration',
      templates: [
        { image: 'assets/Portfolio Website Gallery/Templates/Illus1.avif', alt: 'Illustration template 1', link: "#" },
        { image: 'assets/Portfolio Website Gallery/Templates/Illus2.avif', alt: 'Illustration template 2', link: "#" },
        { image: 'assets/Portfolio Website Gallery/Templates/Illus3.avif', alt: 'Illustration template 3', link: "#" },
      ]
    },
    {
      label: 'Music',
      templates: [
        { image: 'assets/Portfolio Website Gallery/Templates/Model1.avif', alt: 'Music template 1', link: "#" },
        { image: 'assets/Portfolio Website Gallery/Templates/Model2.avif', alt: 'Music template 2', link: "#" },
        { image: 'assets/Portfolio Website Gallery/Templates/Model3.avif', alt: 'Music template 3', link: "#" },
      ]
    },
    {
      label: 'Model',
      templates: [
        { image: 'assets/Portfolio Website Gallery/Templates/Music1.avif', alt: 'Model template 1', link: "#" },
        { image: 'assets/Portfolio Website Gallery/Templates/Music2.avif', alt: 'Model template 2', link: "#" },
        { image: 'assets/Portfolio Website Gallery/Templates/Music3.avif', alt: 'Model template 3', link: "#" },
      ]
    },
    {
      label: 'Photography',
      templates: [
        { image: 'assets/Portfolio Website Gallery/Templates/Photography1.avif', alt: 'Photography template 1', link: "#" },
        { image: 'assets/Portfolio Website Gallery/Templates/Photography2.avif', alt: 'Photography template 2', link: "#" },
        { image: 'assets/Portfolio Website Gallery/Templates/Photography3.avif', alt: 'Photography template 3', link: "#" },
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
