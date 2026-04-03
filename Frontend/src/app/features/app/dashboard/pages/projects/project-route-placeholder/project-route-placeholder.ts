import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Params, Router, RouterModule } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { catchError, distinctUntilChanged, finalize, map, of, switchMap } from 'rxjs';
import {
  getCompletedProjectSetupItems,
  getProjectSetupNextStep,
  PROJECT_SETUP_ITEMS
} from '../../../../../../shared/app/project-setup/project-setup.data';
import {
  ProjectSalesPageResponse,
  ProjectSalesQuery,
  SalesOrderFilter,
  SalesOrderSort,
  SalesRangePreset
} from '../../../../../../core/models/project-sales.model';
import { ProjectSalesService } from '../../../../../../core/services/project-sales.service';
import { ProjectSalesPageComponent } from './sales-page/project-sales-page.component';
import {
  SalesDeliveryStatView,
  SalesFocusItem,
  SalesKpiCard,
  SalesOption,
  SalesOrderView,
  SalesTopProductView,
  SalesTrendPoint
} from './sales-page/project-sales-page.types';

@Component({
  selector: 'app-project-route-placeholder',
  standalone: true,
  imports: [CommonModule, RouterModule, ProjectSalesPageComponent],
  templateUrl: './project-route-placeholder.html',
  styleUrl: './project-route-placeholder.css'
})
export class ProjectRoutePlaceholder implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly projectSalesService = inject(ProjectSalesService);

  private searchTimeout?: number;

  readonly title = toSignal(
    this.route.data.pipe(map((data) => String(data['title'] ?? 'Project'))),
    { initialValue: String(this.route.snapshot.data['title'] ?? 'Project') }
  );

  readonly projectId = toSignal(
    this.route.parent!.paramMap.pipe(map((params) => params.get('projectId') ?? '')),
    { initialValue: this.route.parent?.snapshot.paramMap.get('projectId') ?? '' }
  );

  readonly setupItems = PROJECT_SETUP_ITEMS;
  readonly completedSetupItems = getCompletedProjectSetupItems(this.setupItems);
  readonly nextSetupStep = getProjectSetupNextStep(this.setupItems);
  readonly ownerName = 'Ismail';
  readonly projectStatusItems = [
    { label: 'Free plan', accent: false },
    { label: 'Compare plans', accent: true },
    { label: 'No subdomain', accent: false },
    { label: 'Connect subdomain', accent: true },
    { label: 'Edit business info', accent: false }
  ] as const;
  readonly analyticsCards = [
    { label: 'Site sessions', value: '-', helper: 'Available after publish' },
    { label: 'Total sales', value: '-', helper: 'Connected once checkout goes live' }
  ] as const;
  readonly featuredActivity = {
    title: 'Domain connection pending',
    description: 'Finish your custom subdomain setup to start receiving visits on your branded URL.',
    actionLabel: 'Continue setup'
  } as const;
  readonly activityItems = [
    {
      title: 'Homepage draft updated',
      description: 'Your latest layout changes are saved and ready for the next review.',
      timeLabel: 'A few minutes ago',
      actionLabel: 'Open editor'
    },
    {
      title: 'Product catalog ready',
      description: 'Collections and featured products were prepared for your storefront.',
      timeLabel: 'Earlier today',
      actionLabel: 'Review catalog'
    }
  ] as const;
  readonly suggestedItems = [
    {
      title: 'Edit your business info',
      description: 'Add your business name, contact details, and core brand details so the site feels complete.',
      actionLabel: 'Add info'
    },
    {
      title: 'Connect a custom subdomain',
      description: 'Launch with a branded URL that customers can remember and trust.',
      actionLabel: 'Connect'
    }
  ] as const;
  readonly salesRangeOptions: ReadonlyArray<SalesOption<SalesRangePreset>> = [
    { label: 'This week', value: 'THIS_WEEK' },
    { label: 'This month', value: 'THIS_MONTH' },
    { label: 'Last 30 days', value: 'LAST_30_DAYS' },
    { label: 'Last 90 days', value: 'LAST_90_DAYS' }
  ];
  readonly salesSortOptions: ReadonlyArray<SalesOption<SalesOrderSort>> = [
    { label: 'Newest first', value: 'PLACED_AT_DESC' },
    { label: 'Oldest first', value: 'PLACED_AT_ASC' },
    { label: 'Highest total', value: 'TOTAL_DESC' },
    { label: 'Lowest total', value: 'TOTAL_ASC' }
  ];
  readonly salesFilterOptions: ReadonlyArray<SalesOption<SalesOrderFilter>> = [
    { label: 'All orders', value: 'ALL' },
    { label: 'Awaiting delivery', value: 'ACTIVE' },
    { label: 'Delivered', value: 'DELIVERED' },
    { label: 'Due on delivery', value: 'DUE_ON_DELIVERY' }
  ];
  readonly salesResponse = signal<ProjectSalesPageResponse | null>(null);
  readonly salesQuery = signal<ProjectSalesQuery>({
    range: 'LAST_30_DAYS',
    compare: false,
    search: '',
    sort: 'PLACED_AT_DESC',
    filter: 'ALL',
    page: 0,
    size: 5
  });
  readonly salesSearchValue = signal('');
  readonly salesErrorMessage = signal('');
  readonly isSalesLoading = signal(false);
  readonly hasLoadedSales = signal(false);
  readonly isExportingSales = signal(false);
  readonly selectedOrderIds = signal<number[]>([]);
  readonly isSalesPage = computed(() => this.title() === 'Sales');
  readonly salesRangeLabel = computed(
    () => this.salesRangeOptions.find((item) => item.value === this.salesQuery().range)?.label ?? 'Last 30 days'
  );
  readonly salesKpis = computed<SalesKpiCard[]>(() => {
    const summary = this.salesResponse()?.summary;
    if (!summary) {
      return [];
    }

    return [
      {
        label: 'Order revenue',
        value: this.formatCurrency(summary.revenue),
        change: this.formatPercent(summary.revenueChangePercent),
        trend: this.trendFromNumber(summary.revenueChangePercent),
        helper: 'Confirmed orders in the selected period'
      },
      {
        label: 'Orders placed',
        value: String(summary.orders),
        change: this.formatPercent(summary.ordersChangePercent),
        trend: this.trendFromNumber(summary.ordersChangePercent),
        helper: 'All orders created from this storefront'
      },
      {
        label: 'Average order value',
        value: this.formatCurrency(summary.averageOrderValue),
        change: this.formatPercent(summary.averageOrderValueChangePercent),
        trend: this.trendFromNumber(summary.averageOrderValueChangePercent),
        helper: 'Average value per order'
      },
      {
        label: 'Orders awaiting delivery',
        value: String(summary.awaitingDelivery),
        change: this.formatCountDelta(summary.awaitingDeliveryChange),
        trend: this.trendFromNumber(summary.awaitingDeliveryChange),
        helper: 'Orders still moving through local delivery'
      },
      {
        label: 'Delivered in period',
        value: String(summary.delivered),
        change: this.formatPercent(summary.deliveredChangePercent),
        trend: this.trendFromNumber(summary.deliveredChangePercent),
        helper: 'Completed orders in the current range'
      },
      {
        label: 'Average delivery time',
        value: `${this.formatNumber(summary.averageDeliveryDays)} days`,
        change: `${summary.averageDeliveryDaysChange > 0 ? '+' : ''}${this.formatNumber(summary.averageDeliveryDaysChange)} d`,
        trend: this.trendFromNumber(summary.averageDeliveryDaysChange * -1),
        helper: 'Average time from order to delivery'
      }
    ];
  });
  readonly salesTrend = computed<SalesTrendPoint[]>(() =>
    this.salesResponse()?.chartPoints.map((point) => ({
      label: point.label,
      revenue: point.revenue,
      orders: point.orders
    })) ?? []
  );
  readonly salesDeliveryStats = computed<SalesDeliveryStatView[]>(() =>
    this.salesResponse()?.deliveryStats.map((item) => ({
      label: item.label,
      value: String(item.value),
      note: item.note
    })) ?? []
  );
  readonly salesTopProducts = computed<SalesTopProductView[]>(() =>
    this.salesResponse()?.topProducts.map((product) => ({
      name: product.name,
      sku: product.sku ?? 'No SKU',
      revenue: this.formatCurrency(product.revenue),
      units: product.units,
      trend: this.formatPercent(product.growthPercent)
    })) ?? []
  );
  readonly salesFocusItems = computed<SalesFocusItem[]>(() => {
    const summary = this.salesResponse()?.summary;
    const deliveryStats = this.salesResponse()?.deliveryStats ?? [];
    const packed = deliveryStats.find((item) => item.label === 'Packed')?.value ?? 0;
    const outForDelivery = deliveryStats.find((item) => item.label === 'Out for delivery')?.value ?? 0;

    if (!summary) {
      return [];
    }

    return [
      {
        step: '01',
        title: summary.awaitingDelivery > 0 ? `${summary.awaitingDelivery} orders need routing` : 'Delivery queue is under control',
        body: summary.awaitingDelivery > 0
          ? 'Group active orders into the next local run so handoffs stay predictable.'
          : 'No backlog is building in the current date range.'
      },
      {
        step: '02',
        title: packed > 0 ? `${packed} orders are packed` : 'Packing queue is clear',
        body: packed > 0
          ? 'Use the packed count to assign the next delivery route without extra back-and-forth.'
          : 'New orders still need confirmation or preparation before dispatch.'
      },
      {
        step: '03',
        title: outForDelivery > 0 ? `${outForDelivery} orders are out now` : `${summary.delivered} delivered in this range`,
        body: outForDelivery > 0
          ? 'Keep collection-on-delivery orders visible so payment handoff stays smooth.'
          : 'Delivered orders confirm the route is closing out cleanly for this period.'
      }
    ];
  });
  readonly salesOrders = computed<SalesOrderView[]>(() =>
    this.salesResponse()?.orders.items.map((order) => ({
      rawId: order.id,
      id: order.orderNumber,
      customer: order.customerName,
      date: this.formatOrderDate(order.placedAt),
      amount: this.formatCurrency(order.total),
      paymentStatus: this.formatPaymentStatus(order.paymentStatus),
      fulfillmentStatus: this.formatFulfillmentStatus(order.fulfillmentStatus)
    })) ?? []
  );
  readonly salesHasData = computed(() => this.salesResponse()?.hasData ?? false);
  readonly salesHasOrders = computed(() => (this.salesResponse()?.orders.items.length ?? 0) > 0);
  readonly salesOrdersPage = computed(() => this.salesResponse()?.orders.page ?? 0);
  readonly salesOrdersTotalPages = computed(() => this.salesResponse()?.orders.totalPages ?? 0);
  readonly salesOrdersTotalElements = computed(() => this.salesResponse()?.orders.totalElements ?? 0);
  readonly allVisibleOrdersSelected = computed(() => {
    const visibleIds = this.salesResponse()?.orders.items.map((item) => item.id) ?? [];
    return visibleIds.length > 0 && visibleIds.every((id) => this.selectedOrderIds().includes(id));
  });

  ngOnInit(): void {
    if (!this.isSalesPage()) {
      return;
    }

    this.route.queryParamMap
      .pipe(
        map((params) => this.parseSalesQuery(params)),
        distinctUntilChanged((left, right) => JSON.stringify(left) === JSON.stringify(right)),
        switchMap((query) => {
          this.salesQuery.set(query);
          this.salesSearchValue.set(query.search ?? '');
          this.salesErrorMessage.set('');
          this.isSalesLoading.set(true);

          const projectId = Number(this.projectId());
          if (!projectId) {
            return of({ data: null, error: 'Project not found.' });
          }

          return this.projectSalesService.getSalesPage(projectId, query).pipe(
            map((data) => ({ data, error: '' })),
            catchError((error) => of({ data: null, error: this.toSalesErrorMessage(error) })),
            finalize(() => {
              this.isSalesLoading.set(false);
              this.hasLoadedSales.set(true);
            })
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(({ data, error }) => {
        if (data) {
          this.salesResponse.set(data);
          this.selectedOrderIds.set([]);
          return;
        }

        this.salesResponse.set(null);
        this.salesErrorMessage.set(error || 'Something went wrong while loading sales data.');
      });
  }

  retrySalesLoad(): void {
    this.loadSalesOnce(this.salesQuery());
  }

  setSalesRange(range: SalesRangePreset): void {
    this.updateSalesQuery({ range, page: 0 });
  }

  toggleComparePeriod(): void {
    this.updateSalesQuery({ compare: !this.salesQuery().compare, page: 0 });
  }

  refreshSalesData(): void {
    this.loadSalesOnce(this.salesQuery());
  }

  exportSalesData(): void {
    const projectId = Number(this.projectId());
    if (!projectId || this.isExportingSales()) {
      return;
    }

    this.isExportingSales.set(true);
    this.projectSalesService.exportSalesOrders(projectId, this.salesQuery())
      .pipe(
        finalize(() => this.isExportingSales.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (blob) => this.downloadBlob(blob, `project-${projectId}-sales-orders.csv`),
        error: () => this.salesErrorMessage.set('Unable to export orders right now. Please try again.')
      });
  }

  onSalesSearchInput(value: string): void {
    this.salesSearchValue.set(value);
    window.clearTimeout(this.searchTimeout);
    this.searchTimeout = window.setTimeout(() => {
      this.updateSalesQuery({ search: value.trim(), page: 0 });
    }, 250);
  }

  setSalesSort(sort: SalesOrderSort): void {
    this.updateSalesQuery({ sort, page: 0 });
  }

  setSalesFilter(filter: SalesOrderFilter): void {
    this.updateSalesQuery({ filter, page: 0 });
  }

  goToOrdersPage(page: number): void {
    if (page < 0 || page >= this.salesOrdersTotalPages()) {
      return;
    }

    this.updateSalesQuery({ page });
  }

  toggleAllOrders(selected: boolean): void {
    const visibleIds = this.salesResponse()?.orders.items.map((item) => item.id) ?? [];
    this.selectedOrderIds.set(selected ? [...visibleIds] : []);
  }

  toggleOrderSelection(orderId: number, selected: boolean): void {
    const current = new Set(this.selectedOrderIds());
    if (selected) {
      current.add(orderId);
    } else {
      current.delete(orderId);
    }
    this.selectedOrderIds.set(Array.from(current));
  }

  private updateSalesQuery(partial: Partial<ProjectSalesQuery>): void {
    const nextQuery = { ...this.salesQuery(), ...partial };
    const queryParams: Params = {
      range: nextQuery.range,
      compare: nextQuery.compare,
      search: nextQuery.search || null,
      sort: nextQuery.sort,
      filter: nextQuery.filter,
      page: nextQuery.page === 0 ? null : nextQuery.page
    };

    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge'
    });
  }

  private loadSalesOnce(query: ProjectSalesQuery): void {
    const projectId = Number(this.projectId());
    if (!projectId) {
      return;
    }

    this.salesErrorMessage.set('');
    this.isSalesLoading.set(true);

    this.projectSalesService.getSalesPage(projectId, query)
      .pipe(
        finalize(() => {
          this.isSalesLoading.set(false);
          this.hasLoadedSales.set(true);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (data) => {
          this.salesResponse.set(data);
          this.selectedOrderIds.set([]);
        },
        error: (error) => {
          this.salesErrorMessage.set(this.toSalesErrorMessage(error));
          this.salesResponse.set(null);
        }
      });
  }

  private parseSalesQuery(params: import('@angular/router').ParamMap): ProjectSalesQuery {
    return {
      range: this.isSalesRangePreset(params.get('range'))
        ? (params.get('range') as SalesRangePreset)
        : ('LAST_30_DAYS' as SalesRangePreset),
      compare: params.get('compare') === 'true',
      search: params.get('search')?.trim() ?? '',
      sort: this.isSalesOrderSort(params.get('sort'))
        ? (params.get('sort') as SalesOrderSort)
        : ('PLACED_AT_DESC' as SalesOrderSort),
      filter: this.isSalesOrderFilter(params.get('filter'))
        ? (params.get('filter') as SalesOrderFilter)
        : ('ALL' as SalesOrderFilter),
      page: this.parsePositiveNumber(params.get('page')),
      size: 5
    };
  }

  private parsePositiveNumber(value: string | null): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  }

  private isSalesRangePreset(value: string | null): value is SalesRangePreset {
    return ['THIS_WEEK', 'THIS_MONTH', 'LAST_30_DAYS', 'LAST_90_DAYS'].includes(value ?? '');
  }

  private isSalesOrderSort(value: string | null): value is SalesOrderSort {
    return ['PLACED_AT_DESC', 'PLACED_AT_ASC', 'TOTAL_DESC', 'TOTAL_ASC'].includes(value ?? '');
  }

  private isSalesOrderFilter(value: string | null): value is SalesOrderFilter {
    return ['ALL', 'ACTIVE', 'DELIVERED', 'DUE_ON_DELIVERY'].includes(value ?? '');
  }

  private trendFromNumber(value: number): 'up' | 'down' | 'neutral' {
    if (value > 0) {
      return 'up';
    }

    if (value < 0) {
      return 'down';
    }

    return 'neutral';
  }

  private formatCurrency(value: number): string {
    return `${this.formatNumber(value)} TND`;
  }

  private formatNumber(value: number): string {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: value % 1 === 0 ? 0 : 1,
      maximumFractionDigits: 2
    }).format(value);
  }

  private formatPercent(value: number): string {
    return `${value > 0 ? '+' : ''}${this.formatNumber(value)}%`;
  }

  private formatCountDelta(value: number): string {
    return `${value > 0 ? '+' : ''}${Math.round(value)}`;
  }

  private formatOrderDate(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private formatPaymentStatus(value: string): string {
    return value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
  }

  private formatFulfillmentStatus(value: string): string {
    return value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
  }

  private toSalesErrorMessage(error: unknown): string {
    const status = typeof error === 'object' && error && 'status' in error
      ? (error as { status?: number }).status
      : undefined;

    if (status === 0) {
      return 'Please check your connection and try again.';
    }

    if (status === 403) {
      return 'You do not have access to this sales data.';
    }

    return 'Something went wrong while loading sales data. Please try again.';
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(objectUrl);
  }
}
