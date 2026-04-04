import { Component, ElementRef, EventEmitter, HostListener, Input, OnChanges, Output, SimpleChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Pagination } from '../pagination/pagination';
import { ActiveFilters, TemplateItem } from '../../template-gallery';

const ITEMS_PER_PAGE = 12;

@Component({
  selector: 'app-template-grid',
  imports: [CommonModule, RouterLink, Pagination],
  templateUrl: './template-grid-live.html',
  styleUrl: './template-grid.css',
})
export class TemplateGridLive implements OnChanges {
  @Input() templates: TemplateItem[] = [];
  @Input() isLoading = false;
  @Input() errorMessage = '';
  @Input() searchQuery: string = '';
  @Input() activeFilters!: ActiveFilters;

  @Output() sortChange = new EventEmitter<'recommended' | 'newest' | 'popular'>();

  sortDropdownOpen = signal(false);

  readonly sortLabels: Record<string, string> = {
    recommended: 'Recommended',
    newest: 'Newest',
    popular: 'Most Popular',
  };

  allFilteredTemplates: TemplateItem[] = [];
  pagedTemplates: TemplateItem[] = [];
  currentPage = 1;
  totalPages = 1;

  constructor(private readonly elRef: ElementRef) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elRef.nativeElement.contains(event.target)) {
      this.sortDropdownOpen.set(false);
    }
  }

  ngOnChanges(_: SimpleChanges): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  applyFilters(): void {
    let results = [...this.templates];

    if (this.activeFilters?.category === 'blank') {
      results = results.filter((template) => template.category === 'blank');
    }
    if (this.activeFilters?.type) {
      results = results.filter((template) => template.type === this.activeFilters.type);
    }
    if (this.activeFilters?.industry) {
      results = results.filter((template) => template.industry === this.activeFilters.industry);
    }
    if (this.searchQuery?.trim()) {
      const query = this.searchQuery.toLowerCase().trim();
      results = results.filter((template) =>
        template.name.toLowerCase().includes(query)
        || template.type.toLowerCase().includes(query)
        || template.industry.toLowerCase().includes(query)
      );
    }

    results.sort((left, right) => {
      const leftUpdatedAt = left.updatedAt ?? 0;
      const rightUpdatedAt = right.updatedAt ?? 0;
      const leftUsesCount = left.usesCount ?? 0;
      const rightUsesCount = right.usesCount ?? 0;

      switch (this.activeFilters?.sortBy) {
        case 'newest':
          return rightUpdatedAt - leftUpdatedAt;
        case 'popular':
          return rightUsesCount - leftUsesCount;
        default:
          return rightUsesCount - leftUsesCount || rightUpdatedAt - leftUpdatedAt;
      }
    });

    this.allFilteredTemplates = results;
    this.totalPages = Math.max(1, Math.ceil(results.length / ITEMS_PER_PAGE));
    this.updatePage();
  }

  updatePage(): void {
    const start = (this.currentPage - 1) * ITEMS_PER_PAGE;
    this.pagedTemplates = this.allFilteredTemplates.slice(start, start + ITEMS_PER_PAGE);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.updatePage();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  get sectionTitle(): string {
    if (this.activeFilters?.category === 'blank') return 'Blank Website Templates';
    if (this.activeFilters?.category === 'collections') return 'Collections';
    if (this.searchQuery?.trim()) return `Results for "${this.searchQuery}"`;
    return 'All Website Templates';
  }

  toggleSortDropdown(): void {
    this.sortDropdownOpen.update((value) => !value);
  }

  selectSort(value: 'recommended' | 'newest' | 'popular'): void {
    this.sortChange.emit(value);
    this.sortDropdownOpen.set(false);
  }
}
