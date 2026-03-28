import { Component, Input, Output, EventEmitter, signal, OnChanges, SimpleChanges, HostListener, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActiveFilters } from '../../template-gallery';

@Component({
  selector: 'app-template-hero-section',
  imports: [FormsModule],
  templateUrl: './hero-section.html',
  styleUrl: './hero-section.css',
})
export class HeroSection implements OnChanges {
   @Input() searchQuery: string = '';
  @Input() activeFilters!: ActiveFilters;
 
  @Output() searchChange = new EventEmitter<string>();
  @Output() filtersChange = new EventEmitter<ActiveFilters>();
 
  localQuery = '';
 
  typeDropdownOpen = signal(false);
  industryDropdownOpen = signal(false);
  collectionsDropdownOpen = signal(false);
 
  readonly typeOptions = ['Online Store', 'Portfolio', 'Blog', 'Business', 'Coming Soon', 'Landing Page'];
  readonly industryOptions = ['Art & Design', 'Beauty & Wellness', 'Education', 'Fashion & Clothing', 'Food & Restaurant', 'Health', 'Music', 'Photography', 'Real Estate', 'Technology', 'Travel'];
 
  constructor(private elRef: ElementRef) {}
 
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elRef.nativeElement.contains(event.target)) {
      this.closeAllDropdowns();
    }
  }
 
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['searchQuery']) {
      this.localQuery = this.searchQuery;
    }
  }
 
  onInputChange(value: string): void {
    this.searchChange.emit(value);
  }
 
  clearSearch(): void {
    this.localQuery = '';
    this.searchChange.emit('');
  }
 
  setCategory(category: 'all' | 'blank' | 'collections'): void {
    this.filtersChange.emit({ ...this.activeFilters, category });
  }
 
  setType(type: string | null): void {
    this.filtersChange.emit({ ...this.activeFilters, type });
    this.typeDropdownOpen.set(false);
  }
 
  setIndustry(industry: string | null): void {
    this.filtersChange.emit({ ...this.activeFilters, industry });
    this.industryDropdownOpen.set(false);
  }
 
  toggleTypeDropdown(): void {
    const next = !this.typeDropdownOpen();
    this.closeAllDropdowns();
    this.typeDropdownOpen.set(next);
  }
 
  toggleIndustryDropdown(): void {
    const next = !this.industryDropdownOpen();
    this.closeAllDropdowns();
    this.industryDropdownOpen.set(next);
  }
 
  toggleCollectionsDropdown(): void {
    const next = !this.collectionsDropdownOpen();
    this.closeAllDropdowns();
    this.collectionsDropdownOpen.set(next);
  }
 
  closeAllDropdowns(): void {
    this.typeDropdownOpen.set(false);
    this.industryDropdownOpen.set(false);
    this.collectionsDropdownOpen.set(false);
  }
}