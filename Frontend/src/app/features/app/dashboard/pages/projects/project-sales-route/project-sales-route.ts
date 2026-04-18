import { CommonModule } from '@angular/common';
import { Component, DestroyRef, HostListener, OnInit, ViewEncapsulation, computed, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { catchError, distinctUntilChanged, finalize, forkJoin, map, of, switchMap } from 'rxjs';

import {
  CreateProjectOrderRequest,
  ProjectSalesPageResponse,
  ProjectSalesQuery,
  ProjectSalesOrderEditor,
  SalesFulfillmentStatus,
  SalesOrderFilter,
  SalesOrderSort,
  SalesPaymentStatus,
  SalesRangePreset
} from '../../../../../../core/models/project-sales.model';
import { ProjectCatalogProduct } from '../../../../../../core/models/project-catalog.model';
import { ProjectCustomer } from '../../../../../../core/models/project-customers.model';
import { ProjectCatalogService } from '../../../../../../core/services/project-catalog.service';
import { ProjectCustomersService } from '../../../../../../core/services/project-customers.service';
import { ProjectSalesService } from '../../../../../../core/services/project-sales.service';
import { ProjectWorkspacePageCacheService } from '../../../../../../core/services/project-workspace-page-cache.service';
import { ToastService } from '../../../../../../core/services/toast.service';
import { ProjectSalesPageComponent } from '../project-route-placeholder/sales-page/project-sales-page.component';
import { buildProjectSalesPreviewResponse } from './project-sales-preview-data';
import {
  SalesDeliveryStatView,
  SalesFocusItem,
  SalesKpiCard,
  SalesOption,
  SalesOrderView,
  SalesTopProductView,
  SalesTrendPoint
} from '../project-route-placeholder/sales-page/project-sales-page.types';

const SALES_NUMBER_FORMATTER = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2
});

interface CachedProjectSalesState {
  response: ProjectSalesPageResponse;
  orders: ProjectSalesPageResponse['orders']['allItems'];
}

@Component({
  selector: 'app-project-sales-route',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ProjectSalesPageComponent],
  templateUrl: './project-sales-route.html',
  styleUrl: './project-sales-route.css',
  encapsulation: ViewEncapsulation.None,
})
export class ProjectSalesRoute implements OnInit {
  private static readonly orderEditorTransitionMs = 220;
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);
  private readonly projectSalesService = inject(ProjectSalesService);
  private readonly pageCache = inject(ProjectWorkspacePageCacheService);
  private readonly projectCustomersService = inject(ProjectCustomersService);
  private readonly projectCatalogService = inject(ProjectCatalogService);
  private readonly toastService = inject(ToastService);

  private searchTimeout?: number;
  private salesRequestToken = 0;
  private orderEditorCloseTimeout?: number;

  readonly projectId = toSignal(
    this.route.parent!.paramMap.pipe(map((params) => params.get('projectId') ?? '')),
    { initialValue: this.route.parent?.snapshot.paramMap.get('projectId') ?? '' }
  );

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
  readonly paymentStatusOptions: ReadonlyArray<SalesOption<SalesPaymentStatus>> = [
    { label: 'Due on delivery', value: 'DUE_ON_DELIVERY' },
    { label: 'Collected', value: 'COLLECTED' },
    { label: 'Deposit returned', value: 'DEPOSIT_RETURNED' }
  ];
  readonly fulfillmentStatusOptions: ReadonlyArray<SalesOption<SalesFulfillmentStatus>> = [
    { label: 'New', value: 'NEW' },
    { label: 'Packing', value: 'PACKING' },
    { label: 'Scheduled', value: 'SCHEDULED' },
    { label: 'Out for delivery', value: 'OUT_FOR_DELIVERY' },
    { label: 'Delivered', value: 'DELIVERED' },
    { label: 'Cancelled', value: 'CANCELLED' }
  ];
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
  readonly isDeletingOrders = signal(false);
  readonly isOrderEditorOpen = signal(false);
  readonly isOrderEditorClosing = signal(false);
  readonly isOrderEditorLoading = signal(false);
  readonly isOrderSaving = signal(false);
  readonly editingOrderId = signal<number | null>(null);
  readonly availableCustomers = signal<ProjectCustomer[]>([]);
  readonly availableProducts = signal<ProjectCatalogProduct[]>([]);
  readonly selectedOrderIds = signal<number[]>([]);
  readonly cachedSalesOrders = signal<ProjectSalesPageResponse['orders']['allItems']>([]);
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
  readonly filteredSalesOrderRows = computed(() => {
    const query = this.salesQuery();
    const normalizedSearch = (query.search ?? '').trim().toLowerCase();
    const filtered = this.cachedSalesOrders().filter((order) => {
      const matchesSearch = !normalizedSearch
        || order.orderNumber.toLowerCase().includes(normalizedSearch)
        || order.customerName.toLowerCase().includes(normalizedSearch);

      const matchesFilter = (() => {
        switch (query.filter) {
          case 'ACTIVE':
            return order.fulfillmentStatus !== 'DELIVERED' && order.fulfillmentStatus !== 'CANCELLED';
          case 'DELIVERED':
            return order.fulfillmentStatus === 'DELIVERED';
          case 'DUE_ON_DELIVERY':
            return order.paymentStatus === 'DUE_ON_DELIVERY';
          default:
            return true;
        }
      })();

      return matchesSearch && matchesFilter;
    });

    const sorted = [...filtered].sort((left, right) => {
      switch (query.sort) {
        case 'PLACED_AT_ASC':
          return this.toComparableDate(left.placedAt) - this.toComparableDate(right.placedAt);
        case 'TOTAL_DESC':
          return right.total - left.total;
        case 'TOTAL_ASC':
          return left.total - right.total;
        case 'PLACED_AT_DESC':
        default:
          return this.toComparableDate(right.placedAt) - this.toComparableDate(left.placedAt);
      }
    });

    return sorted;
  });
  readonly salesOrdersPage = computed(() => {
    const totalPages = this.salesOrdersTotalPages();
    return totalPages === 0 ? 0 : Math.min(this.salesQuery().page, totalPages - 1);
  });
  readonly pagedSalesOrderRows = computed(() => {
    const page = this.salesOrdersPage();
    const size = this.salesQuery().size;
    const rows = this.filteredSalesOrderRows();
    const start = page * size;
    return rows.slice(start, start + size);
  });
  readonly salesOrders = computed<SalesOrderView[]>(() =>
    this.pagedSalesOrderRows().map((order) => ({
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
  readonly salesHasOrders = computed(() => this.filteredSalesOrderRows().length > 0);
  readonly salesOrdersTotalPages = computed(() => {
    const total = this.filteredSalesOrderRows().length;
    const size = this.salesQuery().size;
    return total === 0 ? 0 : Math.ceil(total / size);
  });
  readonly salesOrdersTotalElements = computed(() => this.filteredSalesOrderRows().length);
  readonly allVisibleOrdersSelected = computed(() => {
    const visibleIds = this.pagedSalesOrderRows().map((item) => item.id);
    return visibleIds.length > 0 && visibleIds.every((id) => this.selectedOrderIds().includes(id));
  });
  readonly orderEditorTitle = computed(() =>
    this.editingOrderId() ? `Edit ${this.orderForm.controls.orderNumber.value || 'order'}` : 'Add order'
  );

  readonly orderForm = this.formBuilder.nonNullable.group({
    customerId: this.formBuilder.control<number | null>(null),
    orderNumber: this.formBuilder.control('', [Validators.required, Validators.maxLength(60)]),
    placedAt: this.formBuilder.control('', [Validators.required]),
    scheduledFor: this.formBuilder.control(''),
    deliveredAt: this.formBuilder.control(''),
    paymentStatus: this.formBuilder.control<SalesPaymentStatus>('DUE_ON_DELIVERY', [Validators.required]),
    fulfillmentStatus: this.formBuilder.control<SalesFulfillmentStatus>('NEW', [Validators.required]),
    deliveryFee: this.formBuilder.control('0.00', [Validators.required]),
    deliveryAddress: this.formBuilder.control(''),
    notes: this.formBuilder.control(''),
    items: this.formBuilder.array([])
  });

  ngOnInit(): void {
    this.route.queryParamMap
      .pipe(
        map((params) => this.parseSalesQuery(params)),
        distinctUntilChanged((left, right) => this.areSalesQueriesEqual(left, right)),
        switchMap((query) => {
          const previousQuery = this.salesQuery();
          const requestToken = ++this.salesRequestToken;
          const projectId = Number(this.projectId());
          const cacheKey = this.buildCacheKey(projectId, query);
          const cachedState = this.pageCache.get<CachedProjectSalesState>(cacheKey);
          this.salesQuery.set(query);
          this.salesSearchValue.set(query.search ?? '');
          this.salesErrorMessage.set('');

          if (cachedState) {
            this.salesResponse.set(cachedState.response);
            this.cachedSalesOrders.set(cachedState.orders);
            this.hasLoadedSales.set(true);
          }

          if (this.hasLoadedSales() && !this.isSalesDataQueryChanged(previousQuery, query)) {
            this.selectedOrderIds.set([]);
            return of({ data: this.salesResponse(), error: '', query, requestToken, skipFetch: true });
          }

          this.isSalesLoading.set(true);

          if (!projectId) {
            return of({ data: null, error: 'Project not found.', query, requestToken, skipFetch: false });
          }

          return this.projectSalesService.getSalesPage(projectId, query).pipe(
            map((data) => ({ data, error: '', query, requestToken, skipFetch: false })),
            catchError((error) => of({ data: null, error: this.toSalesErrorMessage(error), query, requestToken, skipFetch: false })),
            finalize(() => {
              if (requestToken === this.salesRequestToken) {
                this.isSalesLoading.set(false);
                this.hasLoadedSales.set(true);
              }
            })
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(({ data, error, query, requestToken, skipFetch }) => {
        if (requestToken !== this.salesRequestToken) {
          return;
        }

          if (data) {
            const hydrated = this.hydrateSalesPreviewData(data, query);
            this.salesResponse.set(hydrated);
            if (!skipFetch) {
              this.cachedSalesOrders.set(hydrated.orders.allItems ?? []);
              this.pageCache.set(this.buildCacheKey(Number(this.projectId()), query), {
                response: hydrated,
                orders: hydrated.orders.allItems ?? []
              });
            }
            this.selectedOrderIds.set([]);
            return;
          }

          if (!this.hasLoadedSales()) {
            this.salesResponse.set(null);
            this.cachedSalesOrders.set([]);
            this.salesErrorMessage.set(error || 'Something went wrong while loading sales data.');
          }
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

  openCreateOrderEditor(): void {
    this.reopenOrderEditorIfClosing();
    this.editingOrderId.set(null);
    this.resetOrderForm();
    this.isOrderEditorClosing.set(false);
    this.isOrderEditorOpen.set(true);
    this.loadOrderEditorReferences();
  }

  openEditOrderEditor(orderId: number): void {
    const projectId = Number(this.projectId());
    if (!projectId) {
      return;
    }

    this.reopenOrderEditorIfClosing();
    this.editingOrderId.set(orderId);
    this.isOrderEditorClosing.set(false);
    this.isOrderEditorOpen.set(true);
    this.isOrderEditorLoading.set(true);

    forkJoin({
      customersPage: this.projectCustomersService.getCustomersPage(projectId, {}).pipe(catchError(() => of(null))),
      catalogPage: this.projectCatalogService.getCatalogPage(projectId, {}).pipe(catchError(() => of(null))),
      order: this.projectSalesService.getOrder(projectId, orderId)
    })
      .pipe(
        finalize(() => this.isOrderEditorLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: ({ customersPage, catalogPage, order }) => {
          this.availableCustomers.set(customersPage?.customers ?? []);
          this.availableProducts.set(catalogPage?.products ?? []);
          this.fillOrderForm(order);
        },
        error: () => {
          this.toastService.error('Unable to load this order right now.');
          this.closeOrderEditor();
        }
      });
  }

  closeOrderEditor(): void {
    if (this.isOrderSaving() || !this.isOrderEditorOpen() || this.isOrderEditorClosing()) {
      return;
    }

    this.isOrderEditorClosing.set(true);
    window.clearTimeout(this.orderEditorCloseTimeout);
    this.orderEditorCloseTimeout = window.setTimeout(() => {
      this.isOrderEditorOpen.set(false);
      this.isOrderEditorClosing.set(false);
      this.isOrderEditorLoading.set(false);
    }, ProjectSalesRoute.orderEditorTransitionMs);
  }

  addOrderItem(): void {
    this.orderItems.push(this.createOrderItemGroup());
  }

  removeOrderItem(index: number): void {
    if (this.orderItems.length <= 1) {
      return;
    }

    this.orderItems.removeAt(index);
  }

  onEditorProductChange(index: number): void {
    const group = this.orderItems.at(index);
    const productId = Number(group?.get('productId')?.value ?? NaN);
    const product = this.availableProducts().find((item) => item.id === productId);

    if (!group) {
      return;
    }

    if (!product || Number.isNaN(productId)) {
      group.patchValue({
        productId: null
      });
      return;
    }

    group.patchValue({
      productId,
      productName: product.name,
      productSku: product.sku ?? '',
      unitPrice: this.toDecimalString(product.price)
    });
  }

  saveOrder(): void {
    if (this.orderForm.invalid) {
      this.orderForm.markAllAsTouched();
      this.orderItems.controls.forEach((control) => control.markAllAsTouched());
      return;
    }

    const projectId = Number(this.projectId());
    if (!projectId) {
      return;
    }

    const payload = this.buildOrderPayload();
    if (!payload) {
      this.toastService.error('Please review the order values and products before saving.');
      return;
    }

    this.isOrderSaving.set(true);
    const orderId = this.editingOrderId();
    const request$ = orderId
      ? this.projectSalesService.updateOrder(projectId, orderId, payload)
      : this.projectSalesService.createOrder(projectId, payload);

    request$
      .pipe(
        finalize(() => this.isOrderSaving.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
          next: (order) => {
            this.toastService.success(orderId ? 'Order updated.' : 'Order created.');
            this.isOrderSaving.set(false);
            if (orderId) {
              this.closeOrderEditor();
            } else {
              this.editingOrderId.set(order.id);
              this.fillOrderForm(order);
              window.clearTimeout(this.orderEditorCloseTimeout);
              this.isOrderEditorOpen.set(false);
              this.isOrderEditorClosing.set(false);
              this.isOrderEditorLoading.set(false);
            }
            this.refreshSalesData();
          },
        error: () => {
          this.toastService.error('Unable to save this order right now.');
        }
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
    const visibleIds = this.pagedSalesOrderRows().map((item) => item.id);
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

  deleteSelectedOrders(): void {
    const projectId = Number(this.projectId());
    const orderIds = this.selectedOrderIds();
    if (!projectId || orderIds.length === 0 || this.isDeletingOrders()) {
      return;
    }

    this.isDeletingOrders.set(true);
    this.projectSalesService.deleteOrders(projectId, orderIds)
      .pipe(
        finalize(() => this.isDeletingOrders.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          this.selectedOrderIds.set([]);
          this.toastService.success(orderIds.length === 1 ? 'Order deleted.' : 'Orders deleted.');
          this.refreshSalesData();
        },
        error: () => {
          this.toastService.error('Unable to delete the selected orders right now.');
        }
      });
  }

  get orderItems(): FormArray {
    return this.orderForm.controls.items as FormArray;
  }

  customerLabel(customer: ProjectCustomer): string {
    return customer.fullName || [customer.firstName, customer.lastName].filter(Boolean).join(' ').trim() || 'Customer';
  }

  getEditorSubtotal(): string {
    const subtotal = this.orderItems.controls.reduce((sum, control) => {
      const quantity = Number(control.get('quantity')?.value ?? 0);
      const unitPrice = Number(control.get('unitPrice')?.value ?? 0);
      if (!Number.isFinite(quantity) || !Number.isFinite(unitPrice)) {
        return sum;
      }

      return sum + (quantity * unitPrice);
    }, 0);

    return this.formatCurrency(subtotal);
  }

  getEditorTotal(): string {
    const subtotal = this.orderItems.controls.reduce((sum, control) => {
      const quantity = Number(control.get('quantity')?.value ?? 0);
      const unitPrice = Number(control.get('unitPrice')?.value ?? 0);
      return sum + ((Number.isFinite(quantity) ? quantity : 0) * (Number.isFinite(unitPrice) ? unitPrice : 0));
    }, 0);
    const deliveryFee = Number(this.orderForm.controls.deliveryFee.value ?? 0);
    return this.formatCurrency(subtotal + (Number.isFinite(deliveryFee) ? deliveryFee : 0));
  }

  canSubmitOrder(): boolean {
    if (this.isOrderSaving() || this.isOrderEditorLoading() || this.orderForm.invalid) {
      return false;
    }

    if (this.editingOrderId()) {
      return this.orderForm.dirty;
    }

    return true;
  }

  private updateSalesQuery(partial: Partial<ProjectSalesQuery>): void {
    const nextQuery = { ...this.salesQuery(), ...partial };
    if (this.areSalesQueriesEqual(nextQuery, this.salesQuery())) {
      return;
    }

    this.salesQuery.set(nextQuery);
    this.salesSearchValue.set(nextQuery.search ?? '');

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

    const requestToken = ++this.salesRequestToken;
    const cacheKey = this.buildCacheKey(projectId, query);
    this.salesQuery.set(query);
    this.salesErrorMessage.set('');
    this.isSalesLoading.set(true);

    this.projectSalesService.getSalesPage(projectId, query)
      .pipe(
        finalize(() => {
          if (requestToken === this.salesRequestToken) {
            this.isSalesLoading.set(false);
            this.hasLoadedSales.set(true);
          }
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (data) => {
          if (requestToken !== this.salesRequestToken) {
            return;
          }
          const hydrated = this.hydrateSalesPreviewData(data, query);
          this.salesResponse.set(hydrated);
          this.cachedSalesOrders.set(hydrated.orders.allItems ?? []);
          this.pageCache.set(cacheKey, {
            response: hydrated,
            orders: hydrated.orders.allItems ?? []
          });
          this.selectedOrderIds.set([]);
        },
        error: (error) => {
          if (requestToken !== this.salesRequestToken) {
            return;
          }
          if (!this.hasLoadedSales()) {
            this.salesErrorMessage.set(this.toSalesErrorMessage(error));
            this.salesResponse.set(null);
            this.cachedSalesOrders.set([]);
          }
        }
      });
  }

  private loadOrderEditorReferences(): void {
    const projectId = Number(this.projectId());
    if (!projectId) {
      return;
    }

    this.isOrderEditorLoading.set(true);
    forkJoin({
      customersPage: this.projectCustomersService.getCustomersPage(projectId, {}).pipe(catchError(() => of(null))),
      catalogPage: this.projectCatalogService.getCatalogPage(projectId, {}).pipe(catchError(() => of(null)))
    })
      .pipe(
        finalize(() => this.isOrderEditorLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(({ customersPage, catalogPage }) => {
        this.availableCustomers.set(customersPage?.customers ?? []);
        this.availableProducts.set(catalogPage?.products ?? []);
      });
  }

  private resetOrderForm(): void {
    this.orderForm.reset({
      customerId: null,
      orderNumber: this.generateOrderNumber(),
      placedAt: this.toDateTimeInputValue(new Date().toISOString()),
      scheduledFor: '',
      deliveredAt: '',
      paymentStatus: 'DUE_ON_DELIVERY',
      fulfillmentStatus: 'NEW',
      deliveryFee: '0.00',
      deliveryAddress: '',
      notes: ''
    });
    this.orderItems.clear();
    this.orderItems.push(this.createOrderItemGroup());
  }

  private fillOrderForm(order: ProjectSalesOrderEditor): void {
    this.orderForm.reset({
      customerId: order.customerId,
      orderNumber: order.orderNumber,
      placedAt: this.toDateTimeInputValue(order.placedAt),
      scheduledFor: this.toDateTimeInputValue(order.scheduledFor),
      deliveredAt: this.toDateTimeInputValue(order.deliveredAt),
      paymentStatus: order.paymentStatus,
      fulfillmentStatus: order.fulfillmentStatus,
      deliveryFee: this.toDecimalString(order.deliveryFee),
      deliveryAddress: order.deliveryAddress ?? '',
      notes: order.notes ?? ''
    });

    this.orderItems.clear();
    order.items.forEach((item) => {
      this.orderItems.push(this.createOrderItemGroup({
        productId: item.productId,
        productName: item.productName,
        productSku: item.productSku ?? '',
        quantity: item.quantity,
        unitPrice: this.toDecimalString(item.unitPrice)
      }));
    });

    if (this.orderItems.length === 0) {
      this.orderItems.push(this.createOrderItemGroup());
    }
  }

  private createOrderItemGroup(initial?: {
    productId?: number | null;
    productName?: string;
    productSku?: string;
    quantity?: number;
    unitPrice?: string;
  }) {
    return this.formBuilder.group({
      productId: this.formBuilder.control<number | null>(initial?.productId ?? null),
      productName: this.formBuilder.control(initial?.productName ?? '', [Validators.required, Validators.maxLength(140)]),
      productSku: this.formBuilder.control(initial?.productSku ?? '', [Validators.maxLength(80)]),
      quantity: this.formBuilder.control(String(initial?.quantity ?? 1), [Validators.required]),
      unitPrice: this.formBuilder.control(initial?.unitPrice ?? '0.00', [Validators.required])
    });
  }

  private buildOrderPayload(): CreateProjectOrderRequest | null {
    const raw = this.orderForm.getRawValue();
    const deliveryFee = Number(raw.deliveryFee);
    if (!Number.isFinite(deliveryFee) || deliveryFee < 0) {
      return null;
    }

    const items = this.orderItems.controls.map((control) => {
      const productId = control.get('productId')?.value as number | null;
      const productName = String(control.get('productName')?.value ?? '').trim();
      const productSku = String(control.get('productSku')?.value ?? '').trim();
      const quantity = Number(control.get('quantity')?.value ?? 0);
      const unitPrice = Number(control.get('unitPrice')?.value ?? 0);

      if (!productName || !Number.isFinite(quantity) || quantity < 1 || !Number.isFinite(unitPrice) || unitPrice < 0) {
        return null;
      }

      return {
        productId,
        productName,
        productSku: productSku || null,
        quantity,
        unitPrice
      };
    });

    if (items.some((item) => item == null)) {
      return null;
    }

    return {
      customerId: raw.customerId,
      orderNumber: String(raw.orderNumber ?? '').trim(),
      placedAt: String(raw.placedAt ?? ''),
      scheduledFor: raw.scheduledFor?.trim() ? raw.scheduledFor : null,
      deliveredAt: raw.deliveredAt?.trim() ? raw.deliveredAt : null,
      paymentStatus: raw.paymentStatus ?? 'DUE_ON_DELIVERY',
      fulfillmentStatus: raw.fulfillmentStatus ?? 'NEW',
      deliveryFee,
      deliveryAddress: raw.deliveryAddress?.trim() ? raw.deliveryAddress.trim() : null,
      notes: raw.notes?.trim() ? raw.notes.trim() : null,
      items: items as CreateProjectOrderRequest['items']
    };
  }

  private toDateTimeInputValue(value: string | null | undefined): string {
    if (!value) {
      return '';
    }

    return value.slice(0, 16);
  }

  private toDecimalString(value: number): string {
    return Number.isInteger(value) ? `${value}.00` : String(value);
  }

  private generateOrderNumber(): string {
    return `ORD-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
  }

  private parseSalesQuery(params: import('@angular/router').ParamMap): ProjectSalesQuery {
    return {
      range: this.isSalesRangePreset(params.get('range'))
        ? (params.get('range') as SalesRangePreset)
        : 'LAST_30_DAYS',
      compare: params.get('compare') === 'true',
      search: params.get('search')?.trim() ?? '',
      sort: this.isSalesOrderSort(params.get('sort'))
        ? (params.get('sort') as SalesOrderSort)
        : 'PLACED_AT_DESC',
      filter: this.isSalesOrderFilter(params.get('filter'))
        ? (params.get('filter') as SalesOrderFilter)
        : 'ALL',
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

  private areSalesQueriesEqual(left: ProjectSalesQuery, right: ProjectSalesQuery): boolean {
    return left.range === right.range
      && left.compare === right.compare
      && (left.search ?? '') === (right.search ?? '')
      && left.sort === right.sort
      && left.filter === right.filter
      && left.page === right.page
      && left.size === right.size;
  }

  private isSalesDataQueryChanged(left: ProjectSalesQuery, right: ProjectSalesQuery): boolean {
    return left.range !== right.range || left.compare !== right.compare;
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
    const formatted = SALES_NUMBER_FORMATTER.format(value);
    return value % 1 === 0 ? formatted.replace(/\.0+$/, '') : formatted;
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

  private toComparableDate(value: string): number {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : 0;
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

  private hydrateSalesPreviewData(data: ProjectSalesPageResponse, query: ProjectSalesQuery): ProjectSalesPageResponse {
    if (data.hasData || data.orders.items.length > 0 || data.chartPoints.length > 0 || data.topProducts.length > 0) {
      return data;
    }

    return buildProjectSalesPreviewResponse(query);
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(objectUrl);
  }

  private buildCacheKey(projectId: number, query: ProjectSalesQuery): string {
    return `${projectId}:workspace:sales:${query.range}:${query.compare}`;
  }

  @HostListener('document:keydown.escape')
  handleEscape(): void {
    if (this.isOrderEditorOpen()) {
      this.closeOrderEditor();
    }
  }

  private reopenOrderEditorIfClosing(): void {
    if (!this.isOrderEditorClosing()) {
      return;
    }

    window.clearTimeout(this.orderEditorCloseTimeout);
    this.isOrderEditorClosing.set(false);
  }
}
