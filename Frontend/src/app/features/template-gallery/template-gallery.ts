import { Component, signal } from '@angular/core';
import { Header } from "../../shared/header/header";
import { HeroSection } from './components/hero-section/hero-section';
import { TemplateGrid } from './components/template-grid/template-grid';
import { Footer } from "../../shared/footer/footer";

export type TemplateItem = {
  id: number;
  name: string;
  image: string;
  type: string;
  industry: string;
  category: 'all' | 'blank';
};
 
export type ActiveFilters = {
  type: string | null;
  industry: string | null;
  category: 'all' | 'blank' | 'collections';
  sortBy: 'recommended' | 'newest' | 'popular';
};

@Component({
  selector: 'app-templates-gallery',
  imports: [Header, HeroSection, TemplateGrid, Footer],
  templateUrl: './template-gallery.html',
  styleUrl: './template-gallery.css',
})
export class TemplateGallery {
  readonly searchQuery = signal<string>('');
  readonly activeFilters = signal<ActiveFilters>({
    type: null,
    industry: null,
    category: 'all',
    sortBy: 'recommended',
  });
 
  onSearchChange(query: string): void {
    this.searchQuery.set(query);
  }
 
  onFiltersChange(filters: ActiveFilters): void {
    this.activeFilters.set(filters);
  }

  onSortChange(sortBy: ActiveFilters['sortBy']): void {
    this.activeFilters.update((current) => ({ ...current, sortBy }));
  }
}
