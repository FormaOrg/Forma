import {
  ProjectSalesPageResponse,
  ProjectSalesQuery,
  SalesOrderFilter,
  SalesOrderSort,
  SalesRangePreset
} from '../../../../../../core/models/project-sales.model';

type PreviewPaymentStatus = 'DUE_ON_DELIVERY' | 'COLLECTED' | 'DEPOSIT_RETURNED';
type PreviewFulfillmentStatus = 'NEW' | 'PACKING' | 'SCHEDULED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';

interface PreviewOrderLine {
  productId: number;
  productName: string;
  productSku: string;
  quantity: number;
  unitPrice: number;
}

interface PreviewOrder {
  id: number;
  orderNumber: string;
  customerName: string;
  zone: string;
  placedAt: string;
  deliveredAt: string | null;
  paymentStatus: PreviewPaymentStatus;
  fulfillmentStatus: PreviewFulfillmentStatus;
  total: number;
  items: PreviewOrderLine[];
}

interface DateRange {
  startInclusive: Date;
  endExclusive: Date;
}

interface ProductAggregate {
  productId: number;
  name: string;
  sku: string;
  revenue: number;
  units: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const CHART_LABEL_FORMATTER = new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit' });

const PREVIEW_ORDER_SEEDS = [
  {
    id: 501,
    orderNumber: '#FS-2501',
    customerName: 'Amira Ben Salem',
    zone: 'Lac 2',
    daysAgo: 0,
    hour: 10,
    minute: 20,
    paymentStatus: 'DUE_ON_DELIVERY',
    fulfillmentStatus: 'NEW',
    deliveredAfterDays: null,
    items: [
      { productId: 11, productName: 'Signature Tote', productSku: 'TOT-01', quantity: 2, unitPrice: 42 },
      { productId: 13, productName: 'Ceramic Mug', productSku: 'MUG-03', quantity: 1, unitPrice: 28 }
    ]
  },
  {
    id: 502,
    orderNumber: '#FS-2502',
    customerName: 'Nour Trabelsi',
    zone: 'Marsa',
    daysAgo: 1,
    hour: 15,
    minute: 5,
    paymentStatus: 'DUE_ON_DELIVERY',
    fulfillmentStatus: 'PACKING',
    deliveredAfterDays: null,
    items: [
      { productId: 12, productName: 'Cold Brew Pack', productSku: 'CBP-02', quantity: 1, unitPrice: 36 },
      { productId: 14, productName: 'Desk Candle Set', productSku: 'CAN-04', quantity: 1, unitPrice: 52 }
    ]
  },
  {
    id: 503,
    orderNumber: '#FS-2503',
    customerName: 'Yassine Gharbi',
    zone: 'Centre Ville',
    daysAgo: 2,
    hour: 11,
    minute: 50,
    paymentStatus: 'DUE_ON_DELIVERY',
    fulfillmentStatus: 'OUT_FOR_DELIVERY',
    deliveredAfterDays: null,
    items: [
      { productId: 15, productName: 'Ramadan Dates Box', productSku: 'DAT-05', quantity: 3, unitPrice: 18 },
      { productId: 11, productName: 'Signature Tote', productSku: 'TOT-01', quantity: 1, unitPrice: 42 }
    ]
  },
  {
    id: 504,
    orderNumber: '#FS-2504',
    customerName: 'Ines Khemiri',
    zone: 'La Soukra',
    daysAgo: 3,
    hour: 13,
    minute: 35,
    paymentStatus: 'COLLECTED',
    fulfillmentStatus: 'DELIVERED',
    deliveredAfterDays: 1,
    items: [
      { productId: 14, productName: 'Desk Candle Set', productSku: 'CAN-04', quantity: 2, unitPrice: 52 }
    ]
  },
  {
    id: 505,
    orderNumber: '#FS-2505',
    customerName: 'Ahmed Dridi',
    zone: 'Ariana',
    daysAgo: 5,
    hour: 9,
    minute: 10,
    paymentStatus: 'COLLECTED',
    fulfillmentStatus: 'DELIVERED',
    deliveredAfterDays: 2,
    items: [
      { productId: 12, productName: 'Cold Brew Pack', productSku: 'CBP-02', quantity: 2, unitPrice: 36 },
      { productId: 13, productName: 'Ceramic Mug', productSku: 'MUG-03', quantity: 2, unitPrice: 28 }
    ]
  },
  {
    id: 506,
    orderNumber: '#FS-2506',
    customerName: 'Meriem Ben Romdhane',
    zone: 'Bardo',
    daysAgo: 6,
    hour: 16,
    minute: 15,
    paymentStatus: 'DUE_ON_DELIVERY',
    fulfillmentStatus: 'SCHEDULED',
    deliveredAfterDays: null,
    items: [
      { productId: 11, productName: 'Signature Tote', productSku: 'TOT-01', quantity: 1, unitPrice: 42 },
      { productId: 15, productName: 'Ramadan Dates Box', productSku: 'DAT-05', quantity: 4, unitPrice: 18 }
    ]
  },
  {
    id: 507,
    orderNumber: '#FS-2507',
    customerName: 'Salma Mzoughi',
    zone: 'Menzah 6',
    daysAgo: 8,
    hour: 14,
    minute: 45,
    paymentStatus: 'COLLECTED',
    fulfillmentStatus: 'DELIVERED',
    deliveredAfterDays: 1,
    items: [
      { productId: 14, productName: 'Desk Candle Set', productSku: 'CAN-04', quantity: 1, unitPrice: 52 },
      { productId: 12, productName: 'Cold Brew Pack', productSku: 'CBP-02', quantity: 2, unitPrice: 36 }
    ]
  },
  {
    id: 508,
    orderNumber: '#FS-2508',
    customerName: 'Karim Jaziri',
    zone: 'Lac 1',
    daysAgo: 10,
    hour: 12,
    minute: 5,
    paymentStatus: 'DUE_ON_DELIVERY',
    fulfillmentStatus: 'PACKING',
    deliveredAfterDays: null,
    items: [
      { productId: 13, productName: 'Ceramic Mug', productSku: 'MUG-03', quantity: 3, unitPrice: 28 }
    ]
  },
  {
    id: 509,
    orderNumber: '#FS-2509',
    customerName: 'Rim Saidi',
    zone: 'Manouba',
    daysAgo: 12,
    hour: 18,
    minute: 25,
    paymentStatus: 'COLLECTED',
    fulfillmentStatus: 'DELIVERED',
    deliveredAfterDays: 2,
    items: [
      { productId: 11, productName: 'Signature Tote', productSku: 'TOT-01', quantity: 2, unitPrice: 42 },
      { productId: 14, productName: 'Desk Candle Set', productSku: 'CAN-04', quantity: 1, unitPrice: 52 }
    ]
  },
  {
    id: 510,
    orderNumber: '#FS-2510',
    customerName: 'Taha Bousnina',
    zone: 'Sfax Centre',
    daysAgo: 14,
    hour: 10,
    minute: 40,
    paymentStatus: 'COLLECTED',
    fulfillmentStatus: 'DELIVERED',
    deliveredAfterDays: 2,
    items: [
      { productId: 15, productName: 'Ramadan Dates Box', productSku: 'DAT-05', quantity: 6, unitPrice: 18 }
    ]
  },
  {
    id: 511,
    orderNumber: '#FS-2511',
    customerName: 'Farah Ghedira',
    zone: 'Nabeul',
    daysAgo: 15,
    hour: 17,
    minute: 10,
    paymentStatus: 'DUE_ON_DELIVERY',
    fulfillmentStatus: 'OUT_FOR_DELIVERY',
    deliveredAfterDays: null,
    items: [
      { productId: 12, productName: 'Cold Brew Pack', productSku: 'CBP-02', quantity: 1, unitPrice: 36 },
      { productId: 13, productName: 'Ceramic Mug', productSku: 'MUG-03', quantity: 1, unitPrice: 28 }
    ]
  },
  {
    id: 512,
    orderNumber: '#FS-2512',
    customerName: 'Omar Chatti',
    zone: 'Kairouan',
    daysAgo: 18,
    hour: 11,
    minute: 30,
    paymentStatus: 'COLLECTED',
    fulfillmentStatus: 'DELIVERED',
    deliveredAfterDays: 3,
    items: [
      { productId: 14, productName: 'Desk Candle Set', productSku: 'CAN-04', quantity: 1, unitPrice: 52 },
      { productId: 15, productName: 'Ramadan Dates Box', productSku: 'DAT-05', quantity: 2, unitPrice: 18 }
    ]
  },
  {
    id: 513,
    orderNumber: '#FS-2513',
    customerName: 'Leila Ben Youssef',
    zone: 'Monastir',
    daysAgo: 21,
    hour: 13,
    minute: 55,
    paymentStatus: 'DUE_ON_DELIVERY',
    fulfillmentStatus: 'SCHEDULED',
    deliveredAfterDays: null,
    items: [
      { productId: 11, productName: 'Signature Tote', productSku: 'TOT-01', quantity: 1, unitPrice: 42 },
      { productId: 12, productName: 'Cold Brew Pack', productSku: 'CBP-02', quantity: 2, unitPrice: 36 }
    ]
  },
  {
    id: 514,
    orderNumber: '#FS-2514',
    customerName: 'Skander Ayadi',
    zone: 'Mahdia',
    daysAgo: 24,
    hour: 9,
    minute: 50,
    paymentStatus: 'COLLECTED',
    fulfillmentStatus: 'DELIVERED',
    deliveredAfterDays: 1,
    items: [
      { productId: 13, productName: 'Ceramic Mug', productSku: 'MUG-03', quantity: 4, unitPrice: 28 }
    ]
  },
  {
    id: 515,
    orderNumber: '#FS-2515',
    customerName: 'Asma Kallel',
    zone: 'Gabes',
    daysAgo: 26,
    hour: 16,
    minute: 35,
    paymentStatus: 'COLLECTED',
    fulfillmentStatus: 'DELIVERED',
    deliveredAfterDays: 2,
    items: [
      { productId: 15, productName: 'Ramadan Dates Box', productSku: 'DAT-05', quantity: 5, unitPrice: 18 },
      { productId: 11, productName: 'Signature Tote', productSku: 'TOT-01', quantity: 1, unitPrice: 42 }
    ]
  },
  {
    id: 516,
    orderNumber: '#FS-2516',
    customerName: 'Hedi Triki',
    zone: 'Lac 2',
    daysAgo: 28,
    hour: 12,
    minute: 40,
    paymentStatus: 'DUE_ON_DELIVERY',
    fulfillmentStatus: 'CANCELLED',
    deliveredAfterDays: null,
    items: [
      { productId: 12, productName: 'Cold Brew Pack', productSku: 'CBP-02', quantity: 1, unitPrice: 36 }
    ]
  },
  {
    id: 517,
    orderNumber: '#FS-2417',
    customerName: 'Sarra Bouaziz',
    zone: 'Marsa',
    daysAgo: 33,
    hour: 14,
    minute: 10,
    paymentStatus: 'COLLECTED',
    fulfillmentStatus: 'DELIVERED',
    deliveredAfterDays: 1,
    items: [
      { productId: 14, productName: 'Desk Candle Set', productSku: 'CAN-04', quantity: 1, unitPrice: 52 },
      { productId: 13, productName: 'Ceramic Mug', productSku: 'MUG-03', quantity: 1, unitPrice: 28 }
    ]
  },
  {
    id: 518,
    orderNumber: '#FS-2418',
    customerName: 'Walid Hmidi',
    zone: 'Bizerte',
    daysAgo: 36,
    hour: 11,
    minute: 0,
    paymentStatus: 'DUE_ON_DELIVERY',
    fulfillmentStatus: 'DELIVERED',
    deliveredAfterDays: 2,
    items: [
      { productId: 11, productName: 'Signature Tote', productSku: 'TOT-01', quantity: 2, unitPrice: 42 }
    ]
  },
  {
    id: 519,
    orderNumber: '#FS-2419',
    customerName: 'Ons Tlili',
    zone: 'Sousse',
    daysAgo: 40,
    hour: 15,
    minute: 20,
    paymentStatus: 'COLLECTED',
    fulfillmentStatus: 'DELIVERED',
    deliveredAfterDays: 1,
    items: [
      { productId: 12, productName: 'Cold Brew Pack', productSku: 'CBP-02', quantity: 3, unitPrice: 36 }
    ]
  },
  {
    id: 520,
    orderNumber: '#FS-2420',
    customerName: 'Rania Hajri',
    zone: 'Ariana',
    daysAgo: 45,
    hour: 10,
    minute: 25,
    paymentStatus: 'COLLECTED',
    fulfillmentStatus: 'DELIVERED',
    deliveredAfterDays: 2,
    items: [
      { productId: 15, productName: 'Ramadan Dates Box', productSku: 'DAT-05', quantity: 4, unitPrice: 18 }
    ]
  },
  {
    id: 521,
    orderNumber: '#FS-2421',
    customerName: 'Nadhem Louati',
    zone: 'Menzah 9',
    daysAgo: 52,
    hour: 12,
    minute: 15,
    paymentStatus: 'DUE_ON_DELIVERY',
    fulfillmentStatus: 'DELIVERED',
    deliveredAfterDays: 1,
    items: [
      { productId: 13, productName: 'Ceramic Mug', productSku: 'MUG-03', quantity: 2, unitPrice: 28 },
      { productId: 14, productName: 'Desk Candle Set', productSku: 'CAN-04', quantity: 1, unitPrice: 52 }
    ]
  },
  {
    id: 522,
    orderNumber: '#FS-2422',
    customerName: 'Chaima Ghannouchi',
    zone: 'La Soukra',
    daysAgo: 61,
    hour: 17,
    minute: 5,
    paymentStatus: 'COLLECTED',
    fulfillmentStatus: 'DELIVERED',
    deliveredAfterDays: 2,
    items: [
      { productId: 12, productName: 'Cold Brew Pack', productSku: 'CBP-02', quantity: 2, unitPrice: 36 },
      { productId: 11, productName: 'Signature Tote', productSku: 'TOT-01', quantity: 1, unitPrice: 42 }
    ]
  },
  {
    id: 523,
    orderNumber: '#FS-2423',
    customerName: 'Marwen Ben Amor',
    zone: 'Lac 1',
    daysAgo: 72,
    hour: 13,
    minute: 10,
    paymentStatus: 'COLLECTED',
    fulfillmentStatus: 'DELIVERED',
    deliveredAfterDays: 2,
    items: [
      { productId: 15, productName: 'Ramadan Dates Box', productSku: 'DAT-05', quantity: 6, unitPrice: 18 }
    ]
  },
  {
    id: 524,
    orderNumber: '#FS-2424',
    customerName: 'Hiba Ben Arous',
    zone: 'Sidi Bou Said',
    daysAgo: 83,
    hour: 9,
    minute: 35,
    paymentStatus: 'COLLECTED',
    fulfillmentStatus: 'DELIVERED',
    deliveredAfterDays: 1,
    items: [
      { productId: 14, productName: 'Desk Candle Set', productSku: 'CAN-04', quantity: 1, unitPrice: 52 },
      { productId: 11, productName: 'Signature Tote', productSku: 'TOT-01', quantity: 1, unitPrice: 42 }
    ]
  }
] as const;

export function buildProjectSalesPreviewResponse(query: ProjectSalesQuery, now = new Date()): ProjectSalesPageResponse {
  const allOrders = buildPreviewOrders(now);
  const currentRange = resolveRange(query.range, now);
  const comparisonRange = previousRange(currentRange);
  const currentOrders = getOrdersInRange(allOrders, currentRange);
  const previousOrders = getOrdersInRange(allOrders, comparisonRange);
  const visibleOrders = applyOrderFilters(currentOrders, query);
  const paginatedOrders = paginateOrders(visibleOrders, query);
  const topProducts = buildTopProducts(currentOrders, previousOrders);
  const compareEnabled = query.compare;

  return {
    currencyCode: 'TND',
    rangePreset: query.range,
    rangeStart: currentRange.startInclusive.toISOString(),
    rangeEndExclusive: currentRange.endExclusive.toISOString(),
    compareEnabled,
    comparisonRangeStart: compareEnabled ? comparisonRange.startInclusive.toISOString() : null,
    comparisonRangeEndExclusive: compareEnabled ? comparisonRange.endExclusive.toISOString() : null,
    summary: buildSummary(currentOrders, previousOrders, currentRange, comparisonRange, compareEnabled),
    chartPoints: buildChartPoints(currentOrders, currentRange),
    deliveryStats: buildDeliveryStats(currentOrders, now),
    topProducts,
    orders: paginatedOrders,
    hasData: currentOrders.length > 0
  };
}

function buildPreviewOrders(now: Date): PreviewOrder[] {
  return PREVIEW_ORDER_SEEDS.map((seed) => {
    const placedAt = withTime(addDays(startOfDay(now), -seed.daysAgo), seed.hour, seed.minute);
    const subtotal = seed.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const deliveryFee = seed.fulfillmentStatus === 'CANCELLED' ? 0 : 8;
    const deliveredAt = seed.deliveredAfterDays == null
      ? null
      : withTime(addDays(startOfDay(placedAt), seed.deliveredAfterDays), 18, 0);

    return {
      id: seed.id,
      orderNumber: seed.orderNumber,
      customerName: seed.customerName,
      zone: seed.zone,
      placedAt: placedAt.toISOString(),
      deliveredAt: deliveredAt?.toISOString() ?? null,
      paymentStatus: seed.paymentStatus,
      fulfillmentStatus: seed.fulfillmentStatus,
      total: roundCurrency(subtotal + deliveryFee),
      items: seed.items.map((item) => ({ ...item }))
    };
  });
}

function resolveRange(range: SalesRangePreset, now: Date): DateRange {
  const today = startOfDay(now);
  switch (range) {
    case 'THIS_WEEK': {
      const day = today.getDay();
      const mondayOffset = day === 0 ? -6 : 1 - day;
      return {
        startInclusive: addDays(today, mondayOffset),
        endExclusive: addDays(today, 1)
      };
    }
    case 'THIS_MONTH':
      return {
        startInclusive: new Date(today.getFullYear(), today.getMonth(), 1),
        endExclusive: addDays(today, 1)
      };
    case 'LAST_90_DAYS':
      return {
        startInclusive: addDays(today, -89),
        endExclusive: addDays(today, 1)
      };
    case 'LAST_30_DAYS':
    default:
      return {
        startInclusive: addDays(today, -29),
        endExclusive: addDays(today, 1)
      };
  }
}

function previousRange(range: DateRange): DateRange {
  const durationMs = range.endExclusive.getTime() - range.startInclusive.getTime();
  return {
    startInclusive: new Date(range.startInclusive.getTime() - durationMs),
    endExclusive: new Date(range.startInclusive.getTime())
  };
}

function getOrdersInRange(orders: PreviewOrder[], range: DateRange): PreviewOrder[] {
  return orders.filter((order) => {
    const placedAt = new Date(order.placedAt).getTime();
    return placedAt >= range.startInclusive.getTime() && placedAt < range.endExclusive.getTime();
  });
}

function buildSummary(
  currentOrders: PreviewOrder[],
  previousOrders: PreviewOrder[],
  currentRange: DateRange,
  comparisonRange: DateRange,
  compareEnabled: boolean
) {
  const currentRevenue = sumRevenue(currentOrders);
  const previousRevenue = sumRevenue(previousOrders);
  const currentAverage = averageOrderValue(currentOrders);
  const previousAverage = averageOrderValue(previousOrders);
  const currentAwaiting = currentOrders.filter(isAwaitingDelivery).length;
  const previousAwaiting = previousOrders.filter(isAwaitingDelivery).length;
  const currentDelivered = deliveredCount(currentOrders, currentRange);
  const previousDelivered = deliveredCount(previousOrders, comparisonRange);
  const currentAverageDeliveryDays = averageDeliveryDays(currentOrders, currentRange);
  const previousAverageDeliveryDays = averageDeliveryDays(previousOrders, comparisonRange);

  return {
    revenue: currentRevenue,
    revenueChangePercent: compareEnabled ? percentageChange(currentRevenue, previousRevenue) : 0,
    orders: currentOrders.length,
    ordersChangePercent: compareEnabled ? percentageChange(currentOrders.length, previousOrders.length) : 0,
    averageOrderValue: currentAverage,
    averageOrderValueChangePercent: compareEnabled ? percentageChange(currentAverage, previousAverage) : 0,
    awaitingDelivery: currentAwaiting,
    awaitingDeliveryChange: compareEnabled ? currentAwaiting - previousAwaiting : 0,
    delivered: currentDelivered,
    deliveredChangePercent: compareEnabled ? percentageChange(currentDelivered, previousDelivered) : 0,
    averageDeliveryDays: currentAverageDeliveryDays,
    averageDeliveryDaysChange: compareEnabled ? roundMetric(currentAverageDeliveryDays - previousAverageDeliveryDays) : 0
  };
}

function buildChartPoints(currentOrders: PreviewOrder[], range: DateRange) {
  const groupedByDate = new Map<string, PreviewOrder[]>();

  for (const order of currentOrders) {
    const key = new Date(order.placedAt).toISOString().slice(0, 10);
    const existing = groupedByDate.get(key) ?? [];
    existing.push(order);
    groupedByDate.set(key, existing);
  }

  const points = [];
  let cursor = new Date(range.startInclusive);
  while (cursor < range.endExclusive) {
    const key = cursor.toISOString().slice(0, 10);
    const ordersForDay = groupedByDate.get(key) ?? [];
    points.push({
      isoDate: key,
      label: CHART_LABEL_FORMATTER.format(cursor),
      revenue: sumRevenue(ordersForDay),
      orders: ordersForDay.length
    });
    cursor = addDays(cursor, 1);
  }

  return points;
}

function buildDeliveryStats(currentOrders: PreviewOrder[], now: Date) {
  const todayKey = startOfDay(now).toISOString().slice(0, 10);
  const newToday = currentOrders.filter((order) => order.placedAt.slice(0, 10) === todayKey).length;
  const packing = currentOrders.filter((order) => order.fulfillmentStatus === 'PACKING').length;
  const outForDelivery = currentOrders.filter((order) => order.fulfillmentStatus === 'OUT_FOR_DELIVERY').length;
  const localZones = new Set(
    currentOrders
      .map((order) => order.zone.trim())
      .filter((zone) => zone.length > 0)
  ).size;

  return [
    {
      label: 'New today',
      value: newToday,
      note: 'Fresh orders to confirm with customers before routing.'
    },
    {
      label: 'Packed',
      value: packing,
      note: 'Orders prepared and ready for the next delivery run.'
    },
    {
      label: 'Out for delivery',
      value: outForDelivery,
      note: 'Orders already assigned to local handoff or delivery.'
    },
    {
      label: 'Local zones',
      value: localZones,
      note: 'Unique delivery areas represented in the selected period.'
    }
  ];
}

function buildTopProducts(currentOrders: PreviewOrder[], previousOrders: PreviewOrder[]) {
  const currentProducts = aggregateProducts(currentOrders);
  const previousProducts = aggregateProducts(previousOrders);

  return Array.from(currentProducts.values())
    .sort((left, right) => {
      if (right.revenue !== left.revenue) {
        return right.revenue - left.revenue;
      }

      return right.units - left.units;
    })
    .slice(0, 4)
    .map((product) => ({
      productId: product.productId,
      name: product.name,
      sku: product.sku,
      revenue: product.revenue,
      units: product.units,
      growthPercent: percentageChange(product.revenue, previousProducts.get(product.sku)?.revenue ?? 0)
    }));
}

function aggregateProducts(orders: PreviewOrder[]) {
  const aggregates = new Map<string, ProductAggregate>();

  for (const order of orders) {
    for (const item of order.items) {
      const current = aggregates.get(item.productSku) ?? {
        productId: item.productId,
        name: item.productName,
        sku: item.productSku,
        revenue: 0,
        units: 0
      };

      current.revenue = roundCurrency(current.revenue + item.quantity * item.unitPrice);
      current.units += item.quantity;
      aggregates.set(item.productSku, current);
    }
  }

  return aggregates;
}

function paginateOrders(orders: PreviewOrder[], query: ProjectSalesQuery) {
  const safeSize = Math.max(1, query.size);
  const totalPages = orders.length === 0 ? 0 : Math.ceil(orders.length / safeSize);
  const safePage = totalPages === 0 ? 0 : Math.min(Math.max(query.page, 0), totalPages - 1);
  const fromIndex = safePage * safeSize;
  const allItems = orders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    placedAt: order.placedAt,
    paymentStatus: order.paymentStatus,
    fulfillmentStatus: order.fulfillmentStatus,
    total: order.total
  }));
  const items = orders.slice(fromIndex, fromIndex + safeSize).map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    placedAt: order.placedAt,
    paymentStatus: order.paymentStatus,
    fulfillmentStatus: order.fulfillmentStatus,
    total: order.total
  }));

  return {
    allItems,
    items,
    page: safePage,
    size: safeSize,
    totalElements: orders.length,
    totalPages,
    search: query.search?.trim() ?? '',
    sort: query.sort,
    filter: query.filter
  };
}

function applyOrderFilters(orders: PreviewOrder[], query: ProjectSalesQuery) {
  const normalizedSearch = query.search?.trim().toLowerCase() ?? '';

  return orders
    .filter((order) => {
      if (!normalizedSearch) {
        return true;
      }

      return order.orderNumber.toLowerCase().includes(normalizedSearch)
        || order.customerName.toLowerCase().includes(normalizedSearch);
    })
    .filter((order) => {
      switch (query.filter) {
        case 'ACTIVE':
          return isAwaitingDelivery(order);
        case 'DELIVERED':
          return order.fulfillmentStatus === 'DELIVERED';
        case 'DUE_ON_DELIVERY':
          return order.paymentStatus === 'DUE_ON_DELIVERY';
        case 'ALL':
        default:
          return true;
      }
    })
    .sort((left, right) => compareOrders(left, right, query.sort));
}

function compareOrders(left: PreviewOrder, right: PreviewOrder, sort: SalesOrderSort) {
  switch (sort) {
    case 'PLACED_AT_ASC':
      return new Date(left.placedAt).getTime() - new Date(right.placedAt).getTime();
    case 'TOTAL_DESC':
      return right.total - left.total;
    case 'TOTAL_ASC':
      return left.total - right.total;
    case 'PLACED_AT_DESC':
    default:
      return new Date(right.placedAt).getTime() - new Date(left.placedAt).getTime();
  }
}

function sumRevenue(orders: PreviewOrder[]) {
  return roundCurrency(orders.reduce((sum, order) => sum + order.total, 0));
}

function averageOrderValue(orders: PreviewOrder[]) {
  if (orders.length === 0) {
    return 0;
  }

  return roundCurrency(sumRevenue(orders) / orders.length);
}

function deliveredCount(orders: PreviewOrder[], range: DateRange) {
  return orders.filter((order) => {
    if (!order.deliveredAt) {
      return false;
    }

    const deliveredAt = new Date(order.deliveredAt).getTime();
    return deliveredAt >= range.startInclusive.getTime() && deliveredAt < range.endExclusive.getTime();
  }).length;
}

function averageDeliveryDays(orders: PreviewOrder[], range: DateRange) {
  const durations = orders
    .filter((order) => order.deliveredAt)
    .filter((order) => {
      const deliveredAt = new Date(order.deliveredAt as string).getTime();
      return deliveredAt >= range.startInclusive.getTime() && deliveredAt < range.endExclusive.getTime();
    })
    .map((order) => {
      const placedAt = new Date(order.placedAt).getTime();
      const deliveredAt = new Date(order.deliveredAt as string).getTime();
      return (deliveredAt - placedAt) / DAY_MS;
    });

  if (durations.length === 0) {
    return 0;
  }

  return roundMetric(durations.reduce((sum, value) => sum + value, 0) / durations.length);
}

function percentageChange(current: number, previous: number) {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }

  return roundMetric(((current - previous) * 100) / previous);
}

function isAwaitingDelivery(order: PreviewOrder) {
  return order.fulfillmentStatus === 'NEW'
    || order.fulfillmentStatus === 'PACKING'
    || order.fulfillmentStatus === 'SCHEDULED'
    || order.fulfillmentStatus === 'OUT_FOR_DELIVERY';
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * DAY_MS);
}

function withTime(date: Date, hour: number, minute: number) {
  const next = new Date(date);
  next.setHours(hour, minute, 0, 0);
  return next;
}

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

function roundMetric(value: number) {
  return Math.round(value * 100) / 100;
}
