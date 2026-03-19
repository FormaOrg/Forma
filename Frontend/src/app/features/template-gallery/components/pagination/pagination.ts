import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';

export type PageItem =
  | { type: 'page'; value: number }
  | { type: 'ellipsis' };

@Component({
  selector: 'app-pagination',
  templateUrl: './pagination.html',
  styleUrl: './pagination.css',
})
export class Pagination implements OnChanges {
  @Input() currentPage: number = 1;
  @Input() totalPages: number = 1;

  @Output() pageChange = new EventEmitter<number>();

  pages: PageItem[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    this.buildPages();
  }

  buildPages(): void {
    const total = this.totalPages;
    const current = this.currentPage;
    const items: PageItem[] = [];

    if (total <= 7) {
      // Show all pages — no ellipsis needed
      for (let i = 1; i <= total; i++) {
        items.push({ type: 'page', value: i });
      }
    } else {
      // Always show first 5 pages, ellipsis, last page
      // OR first page, ellipsis, window around current, ellipsis, last page
      const windowSize = 5; // how many pages to show in the visible window

      if (current <= windowSize) {
        // Near the start: 1 2 3 4 5 … last
        for (let i = 1; i <= windowSize; i++) {
          items.push({ type: 'page', value: i });
        }
        items.push({ type: 'ellipsis' });
        items.push({ type: 'page', value: total });
      } else if (current >= total - (windowSize - 1)) {
        // Near the end: 1 … last-4 last-3 last-2 last-1 last
        items.push({ type: 'page', value: 1 });
        items.push({ type: 'ellipsis' });
        for (let i = total - (windowSize - 1); i <= total; i++) {
          items.push({ type: 'page', value: i });
        }
      } else {
        // Middle: 1 … cur-1 cur cur+1 … last
        items.push({ type: 'page', value: 1 });
        items.push({ type: 'ellipsis' });
        items.push({ type: 'page', value: current - 1 });
        items.push({ type: 'page', value: current });
        items.push({ type: 'page', value: current + 1 });
        items.push({ type: 'ellipsis' });
        items.push({ type: 'page', value: total });
      }
    }

    this.pages = items;
  }

  goTo(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) return;
    this.pageChange.emit(page);
  }

  get isFirst(): boolean { return this.currentPage === 1; }
  get isLast(): boolean  { return this.currentPage === this.totalPages; }
}