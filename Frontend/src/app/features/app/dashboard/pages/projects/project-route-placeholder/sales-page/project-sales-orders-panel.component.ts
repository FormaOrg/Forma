import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

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
  styleUrl: './project-sales-orders-panel.component.css'
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

  @Output() refresh = new EventEmitter<void>();
  @Output() filterChange = new EventEmitter<SalesOrderFilter>();
  @Output() sortChange = new EventEmitter<SalesOrderSort>();
  @Output() searchChange = new EventEmitter<string>();
  @Output() toggleAllOrders = new EventEmitter<boolean>();
  @Output() toggleOrderSelection = new EventEmitter<SalesOrderSelectionChange>();
  @Output() pageChange = new EventEmitter<number>();

  onFilterChange(value: string): void {
    this.filterChange.emit(value as SalesOrderFilter);
  }

  onSortChange(value: string): void {
    this.sortChange.emit(value as SalesOrderSort);
  }

  onSearchChange(value: string): void {
    this.searchChange.emit(value);
  }

  previousPage(): void {
    this.pageChange.emit(this.page - 1);
  }

  nextPage(): void {
    this.pageChange.emit(this.page + 1);
  }
}
