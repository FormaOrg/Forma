import { Component, Input, Output, EventEmitter, signal, OnChanges, SimpleChanges, HostListener, ElementRef } from '@angular/core';
import { Pagination } from '../pagination/pagination';
import { ActiveFilters, TemplateItem } from '../../template-gallery';


const ITEMS_PER_PAGE = 12;

const MOCK_TEMPLATES: TemplateItem[] = [
  { id: 1,  name: 'Coming Soon (Minimal)',      image: 'assets/Templates Gallery/Mock Templates/1.jpg', type: 'Coming Soon',  industry: 'Technology',         category: 'all' },
  { id: 2,  name: 'Hair Salon (Stylish)',        image: 'assets/Templates Gallery/Mock Templates/2.jpg', type: 'Business',     industry: 'Beauty & Wellness',  category: 'all' },
  { id: 3,  name: 'Real Estate Agent (Yellow)',  image: 'assets/Templates Gallery/Mock Templates/3.jpg', type: 'Business',     industry: 'Real Estate',        category: 'all' },
  { id: 4,  name: 'Portfolio (Minimal)',         image: 'assets/Templates Gallery/Mock Templates/4.jpg', type: 'Portfolio',    industry: 'Art & Design',       category: 'all' },
  { id: 5,  name: 'Food Blog',                   image: 'assets/Templates Gallery/Mock Templates/5.jpg', type: 'Blog',         industry: 'Food & Restaurant',  category: 'all' },
  { id: 6,  name: 'Fashion Store',               image: 'assets/Templates Gallery/Mock Templates/6.jpg', type: 'Online Store', industry: 'Fashion & Clothing', category: 'all' },
  { id: 7,  name: 'Blank (Light)',               image: 'assets/Templates Gallery/Mock Templates/7.jpg', type: 'Landing Page', industry: 'Technology',         category: 'blank' },
  { id: 8,  name: 'Blank (Dark)',                image: 'assets/Templates Gallery/Mock Templates/8.jpg', type: 'Landing Page', industry: 'Technology',         category: 'blank' },
  { id: 9,  name: 'Photography Portfolio',       image: 'assets/Templates Gallery/Mock Templates/9.jpg', type: 'Portfolio',    industry: 'Photography',        category: 'all' },
  { id: 10, name: 'Music Artist',                image: 'assets/Templates Gallery/Mock Templates/10.jpg', type: 'Business',     industry: 'Music',              category: 'all' },
  { id: 11, name: 'Health & Wellness',           image: 'assets/Templates Gallery/Mock Templates/11.jpg', type: 'Business',     industry: 'Health',             category: 'all' },
  { id: 12, name: 'Travel Blog',                 image: 'assets/Templates Gallery/Mock Templates/12.jpg', type: 'Blog',         industry: 'Travel',             category: 'all' },
  { id: 2,  name: 'Hair Salon (Stylish)',        image: 'assets/Templates Gallery/Mock Templates/2.jpg', type: 'Business',     industry: 'Beauty & Wellness',  category: 'all' },
  { id: 3,  name: 'Real Estate Agent (Yellow)',  image: 'assets/Templates Gallery/Mock Templates/3.jpg', type: 'Business',     industry: 'Real Estate',        category: 'all' },
  { id: 4,  name: 'Portfolio (Minimal)',         image: 'assets/Templates Gallery/Mock Templates/4.jpg', type: 'Portfolio',    industry: 'Art & Design',       category: 'all' },
  { id: 5,  name: 'Food Blog',                   image: 'assets/Templates Gallery/Mock Templates/5.jpg', type: 'Blog',         industry: 'Food & Restaurant',  category: 'all' },
  { id: 6,  name: 'Fashion Store',               image: 'assets/Templates Gallery/Mock Templates/6.jpg', type: 'Online Store', industry: 'Fashion & Clothing', category: 'all' },
  { id: 7,  name: 'Blank (Light)',               image: 'assets/Templates Gallery/Mock Templates/7.jpg', type: 'Landing Page', industry: 'Technology',         category: 'blank' },
  { id: 8,  name: 'Blank (Dark)',                image: 'assets/Templates Gallery/Mock Templates/8.jpg', type: 'Landing Page', industry: 'Technology',         category: 'blank' },
  { id: 9,  name: 'Photography Portfolio',       image: 'assets/Templates Gallery/Mock Templates/9.jpg', type: 'Portfolio',    industry: 'Photography',        category: 'all' },
  { id: 10, name: 'Music Artist',                image: 'assets/Templates Gallery/Mock Templates/10.jpg', type: 'Business',     industry: 'Music',              category: 'all' },
  { id: 11, name: 'Health & Wellness',           image: 'assets/Templates Gallery/Mock Templates/11.jpg', type: 'Business',     industry: 'Health',             category: 'all' },
  { id: 12, name: 'Travel Blog',                 image: 'assets/Templates Gallery/Mock Templates/12.jpg', type: 'Blog',         industry: 'Travel',             category: 'all' },
  { id: 2,  name: 'Hair Salon (Stylish)',        image: 'assets/Templates Gallery/Mock Templates/2.jpg', type: 'Business',     industry: 'Beauty & Wellness',  category: 'all' },
  { id: 3,  name: 'Real Estate Agent (Yellow)',  image: 'assets/Templates Gallery/Mock Templates/3.jpg', type: 'Business',     industry: 'Real Estate',        category: 'all' },
  { id: 4,  name: 'Portfolio (Minimal)',         image: 'assets/Templates Gallery/Mock Templates/4.jpg', type: 'Portfolio',    industry: 'Art & Design',       category: 'all' },
  { id: 5,  name: 'Food Blog',                   image: 'assets/Templates Gallery/Mock Templates/5.jpg', type: 'Blog',         industry: 'Food & Restaurant',  category: 'all' },
  { id: 6,  name: 'Fashion Store',               image: 'assets/Templates Gallery/Mock Templates/6.jpg', type: 'Online Store', industry: 'Fashion & Clothing', category: 'all' },
  { id: 7,  name: 'Blank (Light)',               image: 'assets/Templates Gallery/Mock Templates/7.jpg', type: 'Landing Page', industry: 'Technology',         category: 'blank' },
  { id: 8,  name: 'Blank (Dark)',                image: 'assets/Templates Gallery/Mock Templates/8.jpg', type: 'Landing Page', industry: 'Technology',         category: 'blank' },
  { id: 9,  name: 'Photography Portfolio',       image: 'assets/Templates Gallery/Mock Templates/9.jpg', type: 'Portfolio',    industry: 'Photography',        category: 'all' },
  { id: 10, name: 'Music Artist',                image: 'assets/Templates Gallery/Mock Templates/10.jpg', type: 'Business',     industry: 'Music',              category: 'all' },
  { id: 11, name: 'Health & Wellness',           image: 'assets/Templates Gallery/Mock Templates/11.jpg', type: 'Business',     industry: 'Health',             category: 'all' },
  { id: 12, name: 'Travel Blog',                 image: 'assets/Templates Gallery/Mock Templates/12.jpg', type: 'Blog',         industry: 'Travel',             category: 'all' },
  { id: 2,  name: 'Hair Salon (Stylish)',        image: 'assets/Templates Gallery/Mock Templates/2.jpg', type: 'Business',     industry: 'Beauty & Wellness',  category: 'all' },
  { id: 3,  name: 'Real Estate Agent (Yellow)',  image: 'assets/Templates Gallery/Mock Templates/3.jpg', type: 'Business',     industry: 'Real Estate',        category: 'all' },
  { id: 4,  name: 'Portfolio (Minimal)',         image: 'assets/Templates Gallery/Mock Templates/4.jpg', type: 'Portfolio',    industry: 'Art & Design',       category: 'all' },
  { id: 5,  name: 'Food Blog',                   image: 'assets/Templates Gallery/Mock Templates/5.jpg', type: 'Blog',         industry: 'Food & Restaurant',  category: 'all' },
  { id: 6,  name: 'Fashion Store',               image: 'assets/Templates Gallery/Mock Templates/6.jpg', type: 'Online Store', industry: 'Fashion & Clothing', category: 'all' },
  { id: 7,  name: 'Blank (Light)',               image: 'assets/Templates Gallery/Mock Templates/7.jpg', type: 'Landing Page', industry: 'Technology',         category: 'blank' },
  { id: 8,  name: 'Blank (Dark)',                image: 'assets/Templates Gallery/Mock Templates/8.jpg', type: 'Landing Page', industry: 'Technology',         category: 'blank' },
  { id: 9,  name: 'Photography Portfolio',       image: 'assets/Templates Gallery/Mock Templates/9.jpg', type: 'Portfolio',    industry: 'Photography',        category: 'all' },
  { id: 10, name: 'Music Artist',                image: 'assets/Templates Gallery/Mock Templates/10.jpg', type: 'Business',     industry: 'Music',              category: 'all' },
  { id: 11, name: 'Health & Wellness',           image: 'assets/Templates Gallery/Mock Templates/11.jpg', type: 'Business',     industry: 'Health',             category: 'all' },
  { id: 12, name: 'Travel Blog',                 image: 'assets/Templates Gallery/Mock Templates/12.jpg', type: 'Blog',         industry: 'Travel',             category: 'all' },
  { id: 2,  name: 'Hair Salon (Stylish)',        image: 'assets/Templates Gallery/Mock Templates/2.jpg', type: 'Business',     industry: 'Beauty & Wellness',  category: 'all' },
  { id: 3,  name: 'Real Estate Agent (Yellow)',  image: 'assets/Templates Gallery/Mock Templates/3.jpg', type: 'Business',     industry: 'Real Estate',        category: 'all' },
  { id: 4,  name: 'Portfolio (Minimal)',         image: 'assets/Templates Gallery/Mock Templates/4.jpg', type: 'Portfolio',    industry: 'Art & Design',       category: 'all' },
  { id: 5,  name: 'Food Blog',                   image: 'assets/Templates Gallery/Mock Templates/5.jpg', type: 'Blog',         industry: 'Food & Restaurant',  category: 'all' },
  { id: 6,  name: 'Fashion Store',               image: 'assets/Templates Gallery/Mock Templates/6.jpg', type: 'Online Store', industry: 'Fashion & Clothing', category: 'all' },
  { id: 7,  name: 'Blank (Light)',               image: 'assets/Templates Gallery/Mock Templates/7.jpg', type: 'Landing Page', industry: 'Technology',         category: 'blank' },
  { id: 8,  name: 'Blank (Dark)',                image: 'assets/Templates Gallery/Mock Templates/8.jpg', type: 'Landing Page', industry: 'Technology',         category: 'blank' },
  { id: 9,  name: 'Photography Portfolio',       image: 'assets/Templates Gallery/Mock Templates/9.jpg', type: 'Portfolio',    industry: 'Photography',        category: 'all' },
  { id: 10, name: 'Music Artist',                image: 'assets/Templates Gallery/Mock Templates/10.jpg', type: 'Business',     industry: 'Music',              category: 'all' },
  { id: 11, name: 'Health & Wellness',           image: 'assets/Templates Gallery/Mock Templates/11.jpg', type: 'Business',     industry: 'Health',             category: 'all' },
  { id: 12, name: 'Travel Blog',                 image: 'assets/Templates Gallery/Mock Templates/12.jpg', type: 'Blog',         industry: 'Travel',             category: 'all' },
  { id: 2,  name: 'Hair Salon (Stylish)',        image: 'assets/Templates Gallery/Mock Templates/2.jpg', type: 'Business',     industry: 'Beauty & Wellness',  category: 'all' },
  { id: 3,  name: 'Real Estate Agent (Yellow)',  image: 'assets/Templates Gallery/Mock Templates/3.jpg', type: 'Business',     industry: 'Real Estate',        category: 'all' },
  { id: 4,  name: 'Portfolio (Minimal)',         image: 'assets/Templates Gallery/Mock Templates/4.jpg', type: 'Portfolio',    industry: 'Art & Design',       category: 'all' },
  { id: 5,  name: 'Food Blog',                   image: 'assets/Templates Gallery/Mock Templates/5.jpg', type: 'Blog',         industry: 'Food & Restaurant',  category: 'all' },
  { id: 6,  name: 'Fashion Store',               image: 'assets/Templates Gallery/Mock Templates/6.jpg', type: 'Online Store', industry: 'Fashion & Clothing', category: 'all' },
  { id: 7,  name: 'Blank (Light)',               image: 'assets/Templates Gallery/Mock Templates/7.jpg', type: 'Landing Page', industry: 'Technology',         category: 'blank' },
  { id: 8,  name: 'Blank (Dark)',                image: 'assets/Templates Gallery/Mock Templates/8.jpg', type: 'Landing Page', industry: 'Technology',         category: 'blank' },
  { id: 9,  name: 'Photography Portfolio',       image: 'assets/Templates Gallery/Mock Templates/9.jpg', type: 'Portfolio',    industry: 'Photography',        category: 'all' },
  { id: 10, name: 'Music Artist',                image: 'assets/Templates Gallery/Mock Templates/10.jpg', type: 'Business',     industry: 'Music',              category: 'all' },
  { id: 11, name: 'Health & Wellness',           image: 'assets/Templates Gallery/Mock Templates/11.jpg', type: 'Business',     industry: 'Health',             category: 'all' },
  { id: 12, name: 'Travel Blog',                 image: 'assets/Templates Gallery/Mock Templates/12.jpg', type: 'Blog',         industry: 'Travel',             category: 'all' },
  { id: 2,  name: 'Hair Salon (Stylish)',        image: 'assets/Templates Gallery/Mock Templates/2.jpg', type: 'Business',     industry: 'Beauty & Wellness',  category: 'all' },
  { id: 3,  name: 'Real Estate Agent (Yellow)',  image: 'assets/Templates Gallery/Mock Templates/3.jpg', type: 'Business',     industry: 'Real Estate',        category: 'all' },
  { id: 4,  name: 'Portfolio (Minimal)',         image: 'assets/Templates Gallery/Mock Templates/4.jpg', type: 'Portfolio',    industry: 'Art & Design',       category: 'all' },
  { id: 5,  name: 'Food Blog',                   image: 'assets/Templates Gallery/Mock Templates/5.jpg', type: 'Blog',         industry: 'Food & Restaurant',  category: 'all' },
  { id: 6,  name: 'Fashion Store',               image: 'assets/Templates Gallery/Mock Templates/6.jpg', type: 'Online Store', industry: 'Fashion & Clothing', category: 'all' },
  { id: 7,  name: 'Blank (Light)',               image: 'assets/Templates Gallery/Mock Templates/7.jpg', type: 'Landing Page', industry: 'Technology',         category: 'blank' },
  { id: 8,  name: 'Blank (Dark)',                image: 'assets/Templates Gallery/Mock Templates/8.jpg', type: 'Landing Page', industry: 'Technology',         category: 'blank' },
  { id: 9,  name: 'Photography Portfolio',       image: 'assets/Templates Gallery/Mock Templates/9.jpg', type: 'Portfolio',    industry: 'Photography',        category: 'all' },
  { id: 10, name: 'Music Artist',                image: 'assets/Templates Gallery/Mock Templates/10.jpg', type: 'Business',     industry: 'Music',              category: 'all' },
  { id: 11, name: 'Health & Wellness',           image: 'assets/Templates Gallery/Mock Templates/11.jpg', type: 'Business',     industry: 'Health',             category: 'all' },
  { id: 12, name: 'Travel Blog',                 image: 'assets/Templates Gallery/Mock Templates/12.jpg', type: 'Blog',         industry: 'Travel',             category: 'all' },
  { id: 2,  name: 'Hair Salon (Stylish)',        image: 'assets/Templates Gallery/Mock Templates/2.jpg', type: 'Business',     industry: 'Beauty & Wellness',  category: 'all' },
  { id: 3,  name: 'Real Estate Agent (Yellow)',  image: 'assets/Templates Gallery/Mock Templates/3.jpg', type: 'Business',     industry: 'Real Estate',        category: 'all' },
  { id: 4,  name: 'Portfolio (Minimal)',         image: 'assets/Templates Gallery/Mock Templates/4.jpg', type: 'Portfolio',    industry: 'Art & Design',       category: 'all' },
  { id: 5,  name: 'Food Blog',                   image: 'assets/Templates Gallery/Mock Templates/5.jpg', type: 'Blog',         industry: 'Food & Restaurant',  category: 'all' },
  { id: 6,  name: 'Fashion Store',               image: 'assets/Templates Gallery/Mock Templates/6.jpg', type: 'Online Store', industry: 'Fashion & Clothing', category: 'all' },
  { id: 7,  name: 'Blank (Light)',               image: 'assets/Templates Gallery/Mock Templates/7.jpg', type: 'Landing Page', industry: 'Technology',         category: 'blank' },
  { id: 8,  name: 'Blank (Dark)',                image: 'assets/Templates Gallery/Mock Templates/8.jpg', type: 'Landing Page', industry: 'Technology',         category: 'blank' },
  { id: 9,  name: 'Photography Portfolio',       image: 'assets/Templates Gallery/Mock Templates/9.jpg', type: 'Portfolio',    industry: 'Photography',        category: 'all' },
  { id: 10, name: 'Music Artist',                image: 'assets/Templates Gallery/Mock Templates/10.jpg', type: 'Business',     industry: 'Music',              category: 'all' },
  { id: 11, name: 'Health & Wellness',           image: 'assets/Templates Gallery/Mock Templates/11.jpg', type: 'Business',     industry: 'Health',             category: 'all' },
  { id: 12, name: 'Travel Blog',                 image: 'assets/Templates Gallery/Mock Templates/12.jpg', type: 'Blog',         industry: 'Travel',             category: 'all' },
  { id: 2,  name: 'Hair Salon (Stylish)',        image: 'assets/Templates Gallery/Mock Templates/2.jpg', type: 'Business',     industry: 'Beauty & Wellness',  category: 'all' },
  { id: 3,  name: 'Real Estate Agent (Yellow)',  image: 'assets/Templates Gallery/Mock Templates/3.jpg', type: 'Business',     industry: 'Real Estate',        category: 'all' },
  { id: 4,  name: 'Portfolio (Minimal)',         image: 'assets/Templates Gallery/Mock Templates/4.jpg', type: 'Portfolio',    industry: 'Art & Design',       category: 'all' },
  { id: 5,  name: 'Food Blog',                   image: 'assets/Templates Gallery/Mock Templates/5.jpg', type: 'Blog',         industry: 'Food & Restaurant',  category: 'all' },
  { id: 6,  name: 'Fashion Store',               image: 'assets/Templates Gallery/Mock Templates/6.jpg', type: 'Online Store', industry: 'Fashion & Clothing', category: 'all' },
  { id: 7,  name: 'Blank (Light)',               image: 'assets/Templates Gallery/Mock Templates/7.jpg', type: 'Landing Page', industry: 'Technology',         category: 'blank' },
  { id: 8,  name: 'Blank (Dark)',                image: 'assets/Templates Gallery/Mock Templates/8.jpg', type: 'Landing Page', industry: 'Technology',         category: 'blank' },
  { id: 9,  name: 'Photography Portfolio',       image: 'assets/Templates Gallery/Mock Templates/9.jpg', type: 'Portfolio',    industry: 'Photography',        category: 'all' },
  { id: 10, name: 'Music Artist',                image: 'assets/Templates Gallery/Mock Templates/10.jpg', type: 'Business',     industry: 'Music',              category: 'all' },
  { id: 11, name: 'Health & Wellness',           image: 'assets/Templates Gallery/Mock Templates/11.jpg', type: 'Business',     industry: 'Health',             category: 'all' },
  { id: 12, name: 'Travel Blog',                 image: 'assets/Templates Gallery/Mock Templates/12.jpg', type: 'Blog',         industry: 'Travel',             category: 'all' },
  { id: 2,  name: 'Hair Salon (Stylish)',        image: 'assets/Templates Gallery/Mock Templates/2.jpg', type: 'Business',     industry: 'Beauty & Wellness',  category: 'all' },
  { id: 3,  name: 'Real Estate Agent (Yellow)',  image: 'assets/Templates Gallery/Mock Templates/3.jpg', type: 'Business',     industry: 'Real Estate',        category: 'all' },
  { id: 4,  name: 'Portfolio (Minimal)',         image: 'assets/Templates Gallery/Mock Templates/4.jpg', type: 'Portfolio',    industry: 'Art & Design',       category: 'all' },
  { id: 5,  name: 'Food Blog',                   image: 'assets/Templates Gallery/Mock Templates/5.jpg', type: 'Blog',         industry: 'Food & Restaurant',  category: 'all' },
  { id: 6,  name: 'Fashion Store',               image: 'assets/Templates Gallery/Mock Templates/6.jpg', type: 'Online Store', industry: 'Fashion & Clothing', category: 'all' },
  { id: 7,  name: 'Blank (Light)',               image: 'assets/Templates Gallery/Mock Templates/7.jpg', type: 'Landing Page', industry: 'Technology',         category: 'blank' },
  { id: 8,  name: 'Blank (Dark)',                image: 'assets/Templates Gallery/Mock Templates/8.jpg', type: 'Landing Page', industry: 'Technology',         category: 'blank' },
  { id: 9,  name: 'Photography Portfolio',       image: 'assets/Templates Gallery/Mock Templates/9.jpg', type: 'Portfolio',    industry: 'Photography',        category: 'all' },
  { id: 10, name: 'Music Artist',                image: 'assets/Templates Gallery/Mock Templates/10.jpg', type: 'Business',     industry: 'Music',              category: 'all' },
  { id: 11, name: 'Health & Wellness',           image: 'assets/Templates Gallery/Mock Templates/11.jpg', type: 'Business',     industry: 'Health',             category: 'all' },
  { id: 12, name: 'Travel Blog',                 image: 'assets/Templates Gallery/Mock Templates/12.jpg', type: 'Blog',         industry: 'Travel',             category: 'all' },
  { id: 2,  name: 'Hair Salon (Stylish)',        image: 'assets/Templates Gallery/Mock Templates/2.jpg', type: 'Business',     industry: 'Beauty & Wellness',  category: 'all' },
  { id: 3,  name: 'Real Estate Agent (Yellow)',  image: 'assets/Templates Gallery/Mock Templates/3.jpg', type: 'Business',     industry: 'Real Estate',        category: 'all' },
  { id: 4,  name: 'Portfolio (Minimal)',         image: 'assets/Templates Gallery/Mock Templates/4.jpg', type: 'Portfolio',    industry: 'Art & Design',       category: 'all' },
  { id: 5,  name: 'Food Blog',                   image: 'assets/Templates Gallery/Mock Templates/5.jpg', type: 'Blog',         industry: 'Food & Restaurant',  category: 'all' },
  { id: 6,  name: 'Fashion Store',               image: 'assets/Templates Gallery/Mock Templates/6.jpg', type: 'Online Store', industry: 'Fashion & Clothing', category: 'all' },
  { id: 7,  name: 'Blank (Light)',               image: 'assets/Templates Gallery/Mock Templates/7.jpg', type: 'Landing Page', industry: 'Technology',         category: 'blank' },
  { id: 8,  name: 'Blank (Dark)',                image: 'assets/Templates Gallery/Mock Templates/8.jpg', type: 'Landing Page', industry: 'Technology',         category: 'blank' },
  { id: 9,  name: 'Photography Portfolio',       image: 'assets/Templates Gallery/Mock Templates/9.jpg', type: 'Portfolio',    industry: 'Photography',        category: 'all' },
  { id: 10, name: 'Music Artist',                image: 'assets/Templates Gallery/Mock Templates/10.jpg', type: 'Business',     industry: 'Music',              category: 'all' },
  { id: 11, name: 'Health & Wellness',           image: 'assets/Templates Gallery/Mock Templates/11.jpg', type: 'Business',     industry: 'Health',             category: 'all' },
  { id: 12, name: 'Travel Blog',                 image: 'assets/Templates Gallery/Mock Templates/12.jpg', type: 'Blog',         industry: 'Travel',             category: 'all' },
  { id: 2,  name: 'Hair Salon (Stylish)',        image: 'assets/Templates Gallery/Mock Templates/2.jpg', type: 'Business',     industry: 'Beauty & Wellness',  category: 'all' },
  { id: 3,  name: 'Real Estate Agent (Yellow)',  image: 'assets/Templates Gallery/Mock Templates/3.jpg', type: 'Business',     industry: 'Real Estate',        category: 'all' },
  { id: 4,  name: 'Portfolio (Minimal)',         image: 'assets/Templates Gallery/Mock Templates/4.jpg', type: 'Portfolio',    industry: 'Art & Design',       category: 'all' },
  { id: 5,  name: 'Food Blog',                   image: 'assets/Templates Gallery/Mock Templates/5.jpg', type: 'Blog',         industry: 'Food & Restaurant',  category: 'all' },
  { id: 6,  name: 'Fashion Store',               image: 'assets/Templates Gallery/Mock Templates/6.jpg', type: 'Online Store', industry: 'Fashion & Clothing', category: 'all' },
  { id: 7,  name: 'Blank (Light)',               image: 'assets/Templates Gallery/Mock Templates/7.jpg', type: 'Landing Page', industry: 'Technology',         category: 'blank' },
  { id: 8,  name: 'Blank (Dark)',                image: 'assets/Templates Gallery/Mock Templates/8.jpg', type: 'Landing Page', industry: 'Technology',         category: 'blank' },
  { id: 9,  name: 'Photography Portfolio',       image: 'assets/Templates Gallery/Mock Templates/9.jpg', type: 'Portfolio',    industry: 'Photography',        category: 'all' },
  { id: 10, name: 'Music Artist',                image: 'assets/Templates Gallery/Mock Templates/10.jpg', type: 'Business',     industry: 'Music',              category: 'all' },
  { id: 11, name: 'Health & Wellness',           image: 'assets/Templates Gallery/Mock Templates/11.jpg', type: 'Business',     industry: 'Health',             category: 'all' },
  { id: 12, name: 'Travel Blog',                 image: 'assets/Templates Gallery/Mock Templates/12.jpg', type: 'Blog',         industry: 'Travel',             category: 'all' },
];

@Component({
  selector: 'app-template-grid',
  imports: [Pagination],
  templateUrl: './template-grid.html',
  styleUrl: './template-grid.css',
})
export class TemplateGrid implements OnChanges {
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

  constructor(private elRef: ElementRef) {}

  // Close sort dropdown when clicking outside this component
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elRef.nativeElement.contains(event.target)) {
      this.sortDropdownOpen.set(false);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  applyFilters(): void {
    let results = [...MOCK_TEMPLATES];

    if (this.activeFilters?.category === 'blank') {
      results = results.filter(t => t.category === 'blank');
    }
    if (this.activeFilters?.type) {
      results = results.filter(t => t.type === this.activeFilters.type);
    }
    if (this.activeFilters?.industry) {
      results = results.filter(t => t.industry === this.activeFilters.industry);
    }
    if (this.searchQuery?.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      results = results.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.type.toLowerCase().includes(q) ||
        t.industry.toLowerCase().includes(q)
      );
    }

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
    this.sortDropdownOpen.update(v => !v);
  }

  selectSort(value: 'recommended' | 'newest' | 'popular'): void {
    this.sortChange.emit(value);
    this.sortDropdownOpen.set(false);
  }
}