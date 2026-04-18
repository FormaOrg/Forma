import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';

import { AppIcon } from '../../../../../../../shared/app/icons/app-icon';
import {
  ProjectSalesQuery,
  SalesOrderFilter,
  SalesOrderSort
} from '../../../../../../../core/models/project-sales.model';
import {
  SalesKpiCard,
  SalesOption,
  SalesOrderSelectionChange,
  SalesOrderView
} from './project-sales-page.types';
import { ProjectSalesOrdersTableComponent } from './project-sales-orders-table.component';

@Component({
  selector: 'app-project-sales-orders-panel',
  standalone: true,
  imports: [CommonModule, AppIcon, ProjectSalesOrdersTableComponent],
  templateUrl: './project-sales-orders-panel.component.html',
  styleUrl: './project-sales-orders-panel.component.css',
})
export class ProjectSalesOrdersPanelComponent {
  @Input({ required: true }) kpis: ReadonlyArray<SalesKpiCard> = [];
  @Input({ required: true }) rangeLabel = '';
  @Input({ required: true }) query!: ProjectSalesQuery;
  @Input({ required: true }) filterOptions: ReadonlyArray<SalesOption<SalesOrderFilter>> = [];
  @Input({ required: true }) sortOptions: ReadonlyArray<SalesOption<SalesOrderSort>> = [];
  @Input({ required: true }) searchValue = '';
  @Input({ required: true }) hasOrders = false;
  @Input({ required: true }) orders: ReadonlyArray<SalesOrderView> = [];
  @Input({ required: true }) selectedOrderIds: ReadonlyArray<number> = [];
  @Input({ required: true }) allVisibleOrdersSelected = false;
  @Input({ required: true }) page = 0;
  @Input({ required: true }) totalPages = 0;
  @Input({ required: true }) totalElements = 0;
  @Input({ required: true }) isExporting = false;
  @Input({ required: true }) isDeleting = false;

  @Output() refresh = new EventEmitter<void>();
  @Output() export = new EventEmitter<void>();
  @Output() deleteSelected = new EventEmitter<void>();
  @Output() filterChange = new EventEmitter<SalesOrderFilter>();
  @Output() sortChange = new EventEmitter<SalesOrderSort>();
  @Output() searchChange = new EventEmitter<string>();
  @Output() toggleAllOrders = new EventEmitter<boolean>();
  @Output() toggleOrderSelection = new EventEmitter<SalesOrderSelectionChange>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() createOrder = new EventEmitter<void>();
  @Output() editOrder = new EventEmitter<number>();

  filterDropdownOpen = false;
  sortDropdownOpen = false;

  get selectedCount(): number {
    return this.selectedOrderIds.length;
  }

  get hasSelection(): boolean {
    return this.selectedCount > 0;
  }

  onFilterChange(value: string): void {
    this.filterChange.emit(value as SalesOrderFilter);
  }

  onSortChange(value: string): void {
    this.sortChange.emit(value as SalesOrderSort);
  }

  onSearchChange(value: string): void {
    this.searchChange.emit(value);
  }

  toggleFilterDropdown(): void {
    this.filterDropdownOpen = !this.filterDropdownOpen;
    if (this.filterDropdownOpen) {
      this.sortDropdownOpen = false;
    }
  }

  toggleSortDropdown(): void {
    this.sortDropdownOpen = !this.sortDropdownOpen;
    if (this.sortDropdownOpen) {
      this.filterDropdownOpen = false;
    }
  }

  selectFilter(value: SalesOrderFilter): void {
    this.filterDropdownOpen = false;
    this.onFilterChange(value);
  }

  selectSort(value: SalesOrderSort): void {
    this.sortDropdownOpen = false;
    this.onSortChange(value);
  }

  filterLabel(): string {
    return this.filterOptions.find((option) => option.value === this.query.filter)?.label ?? 'All orders';
  }

  sortLabel(): string {
    return this.sortOptions.find((option) => option.value === this.query.sort)?.label ?? 'Newest first';
  }

  @HostListener('document:pointerdown', ['$event'])
  handleDocumentPointerDown(event: PointerEvent): void {
    const target = event.target as HTMLElement | null;
    if (!target?.closest('.orders-panel__dropdown')) {
      this.filterDropdownOpen = false;
      this.sortDropdownOpen = false;
    }
  }

  @HostListener('document:keydown.escape')
  handleEscape(): void {
    this.filterDropdownOpen = false;
    this.sortDropdownOpen = false;
  }

  previousPage(): void {
    this.pageChange.emit(this.page - 1);
  }

  nextPage(): void {
    this.pageChange.emit(this.page + 1);
  }

  openCreateOrder(): void {
    this.createOrder.emit();
  }

  openEditOrder(orderId: number): void {
    this.editOrder.emit(orderId);
  }

  toggleSelectionState(): void {
    this.toggleAllOrders.emit(!this.allVisibleOrdersSelected);
  }

  clearSelection(): void {
    this.toggleAllOrders.emit(false);
  }

  exportSelection(): void {
    this.export.emit();
  }

  deleteSelection(): void {
    this.deleteSelected.emit();
  }
}
