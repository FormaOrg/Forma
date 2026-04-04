import { Component, computed, inject, signal } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { Header } from "../../shared/header/header";
import { HeroSection } from './components/hero-section/hero-section';
import { TemplateGridLive } from './components/template-grid/template-grid-live';
import { Footer } from "../../shared/footer/footer";
import { ProjectService } from '../../core/services/project.service';
import { TemplateRecord } from '../../core/models/project.model';

export type TemplateItem = {
  id: number | string;
  name: string;
  image: string;
  type: string;
  industry: string;
  category: 'all' | 'blank';
  previewUrl?: string | null;
  previewRoute?: string | null;
  updatedAt?: number;
  usesCount?: number;
};
 
export type ActiveFilters = {
  type: string | null;
  industry: string | null;
  category: 'all' | 'blank' | 'collections';
  sortBy: 'recommended' | 'newest' | 'popular';
};

@Component({
  selector: 'app-templates-gallery',
  imports: [Header, HeroSection, TemplateGridLive, Footer],
  templateUrl: './template-gallery.html',
  styleUrl: './template-gallery.css',
})
export class TemplateGallery {
  private readonly projectService = inject(ProjectService);

  readonly searchQuery = signal<string>('');
  readonly activeFilters = signal<ActiveFilters>({
    type: null,
    industry: null,
    category: 'all',
    sortBy: 'recommended',
  });
  readonly templates = signal<TemplateItem[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal('');
  readonly typeOptions = computed(() =>
    Array.from(new Set(this.templates().map((template) => template.type))).sort((left, right) => left.localeCompare(right))
  );
  readonly industryOptions = computed(() =>
    Array.from(new Set(this.templates().map((template) => template.industry))).sort((left, right) => left.localeCompare(right))
  );

  constructor() {
    this.loadTemplates();
  }
 
  onSearchChange(query: string): void {
    this.searchQuery.set(query);
  }
 
  onFiltersChange(filters: ActiveFilters): void {
    this.activeFilters.set(filters);
  }

  onSortChange(sortBy: ActiveFilters['sortBy']): void {
    this.activeFilters.update((current) => ({ ...current, sortBy }));
  }

  loadTemplates(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.projectService.getPublicTemplates()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (records) => this.templates.set(records.map((record) => this.toTemplateItem(record))),
        error: () => {
          this.templates.set([]);
          this.errorMessage.set('Unable to load templates right now.');
        },
      });
  }

  private toTemplateItem(record: TemplateRecord): TemplateItem {
    const categoryLabel = this.readString(record.category) ?? this.readString(record.label) ?? 'General';
    const tags = Array.isArray(record.tags) ? record.tags.filter((tag): tag is string => typeof tag === 'string' && tag.trim().length > 0) : [];

    return {
      id: record.id,
      name: this.readString(record.name) ?? this.readString(record.title) ?? 'Untitled template',
      image: this.readString(record.previewImageUrl) ?? 'assets/Templates Gallery/Mock Templates/1.jpg',
      type: this.formatLabel(this.readString(record.projectType) ?? this.readString(record.type) ?? 'LANDING_PAGE'),
      industry: tags[0] ?? categoryLabel,
      category: categoryLabel.toLowerCase().includes('blank') ? 'blank' : 'all',
      previewUrl: this.readString(record.previewUrl) ?? null,
      previewRoute: this.readString(record.previewRoute) ?? this.readString(record.route) ?? null,
      updatedAt: Date.parse(this.readString(record.updatedAt) ?? this.readString(record.createdAt) ?? '') || 0,
      usesCount: typeof record.usesCount === 'number' ? record.usesCount : 0,
    };
  }

  private readString(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
  }

  private formatLabel(value: string): string {
    return value
      .toLowerCase()
      .split('_')
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(' ');
  }
}
