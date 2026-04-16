import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

import {
  ProjectSalesQuery,
  SalesOrderFilter,
  SalesOrderSort,
  SalesRangePreset
} from '../../../../../../../core/models/project-sales.model';
import {
  SalesDeliveryStatView,
  SalesFocusItem,
  SalesKpiCard,
  SalesOption,
  SalesOrderSelectionChange,
  SalesOrderView,
  SalesTopProductView,
  SalesTrendPoint
} from './project-sales-page.types';
import { ProjectSalesChartComponent } from './project-sales-chart.component';
import { ProjectSalesDeliveryPanelComponent } from './project-sales-delivery-panel.component';
import { ProjectSalesFocusPanelComponent } from './project-sales-focus-panel.component';
import { ProjectSalesKpiGridComponent } from './project-sales-kpi-grid.component';
import { ProjectSalesOrdersPanelComponent } from './project-sales-orders-panel.component';
import { ProjectSalesProductsPanelComponent } from './project-sales-products-panel.component';

@Component({
  selector: 'app-project-sales-page',
  standalone: true,
  imports: [
    CommonModule,
    ProjectSalesKpiGridComponent,
    ProjectSalesOrdersPanelComponent,
    ProjectSalesChartComponent,
    ProjectSalesDeliveryPanelComponent,
    ProjectSalesProductsPanelComponent,
    ProjectSalesFocusPanelComponent
  ],
  templateUrl: './project-sales-page.component.html',
  styleUrl: './project-sales-page.component.css'
})
export class ProjectSalesPageComponent {
  @Input({ required: true }) rangeOptions: ReadonlyArray<SalesOption<SalesRangePreset>> = [];
  @Input({ required: true }) sortOptions: ReadonlyArray<SalesOption<SalesOrderSort>> = [];
  @Input({ required: true }) filterOptions: ReadonlyArray<SalesOption<SalesOrderFilter>> = [];
  @Input({ required: true }) query!: ProjectSalesQuery;
  @Input({ required: true }) rangeLabel = '';
  @Input({ required: true }) kpis: ReadonlyArray<SalesKpiCard> = [];
  @Input({ required: true }) trend: ReadonlyArray<SalesTrendPoint> = [];
  @Input({ required: true }) deliveryStats: ReadonlyArray<SalesDeliveryStatView> = [];
  @Input({ required: true }) topProducts: ReadonlyArray<SalesTopProductView> = [];
  @Input({ required: true }) focusItems: ReadonlyArray<SalesFocusItem> = [];
  @Input({ required: true }) orders: ReadonlyArray<SalesOrderView> = [];
  @Input({ required: true }) searchValue = '';
  @Input({ required: true }) errorMessage = '';
  @Input({ required: true }) isLoading = false;
  @Input({ required: true }) hasLoaded = false;
  @Input({ required: true }) hasData = false;
  @Input({ required: true }) hasOrders = false;
  @Input({ required: true }) isExporting = false;
  @Input({ required: true }) selectedOrderIds: ReadonlyArray<number> = [];
  @Input({ required: true }) allVisibleOrdersSelected = false;
  @Input({ required: true }) ordersPage = 0;
  @Input({ required: true }) ordersTotalPages = 0;
  @Input({ required: true }) ordersTotalElements = 0;
  @Input({ required: true }) ordersExporting = false;
  @Input({ required: true }) ordersDeleting = false;

  @Output() rangeChange = new EventEmitter<SalesRangePreset>();
  @Output() compareToggle = new EventEmitter<void>();
  @Output() refresh = new EventEmitter<void>();
  @Output() export = new EventEmitter<void>();
  @Output() retry = new EventEmitter<void>();
  @Output() filterChange = new EventEmitter<SalesOrderFilter>();
  @Output() sortChange = new EventEmitter<SalesOrderSort>();
  @Output() searchChange = new EventEmitter<string>();
  @Output() toggleAllOrders = new EventEmitter<boolean>();
  @Output() toggleOrderSelection = new EventEmitter<SalesOrderSelectionChange>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() createOrder = new EventEmitter<void>();
  @Output() editOrder = new EventEmitter<number>();
  @Output() deleteSelectedOrders = new EventEmitter<void>();

  readonly skeletonCards = [1, 2, 3, 4, 5, 6] as const;
}
