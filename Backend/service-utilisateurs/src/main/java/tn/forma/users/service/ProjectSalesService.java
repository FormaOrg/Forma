package tn.forma.users.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.forma.users.dto.*;
import tn.forma.users.model.*;
import tn.forma.users.repository.ProjectCustomerRepository;
import tn.forma.users.repository.ProjectOrderRepository;
import tn.forma.users.repository.ProjectProductRepository;
import tn.forma.users.repository.ProjectRepository;
import tn.forma.users.repository.UserRepository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.time.DayOfWeek;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.function.Predicate;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProjectSalesService {

    private static final String DEFAULT_CURRENCY = "TND";
    private static final int DEFAULT_PAGE_SIZE = 5;
    private static final int MAX_PAGE_SIZE = 25;
    private static final DateTimeFormatter CHART_LABEL_FORMATTER = DateTimeFormatter.ofPattern("MMM dd", Locale.ENGLISH);
    private static final DateTimeFormatter CSV_DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private final ProjectRepository projectRepository;
    private final ProjectOrderRepository projectOrderRepository;
    private final ProjectCustomerRepository projectCustomerRepository;
    private final ProjectProductRepository projectProductRepository;
    private final UserRepository userRepository;
    private final ProjectAccessService projectAccessService;

    public ProjectSalesPageDto getSalesPage(
            String email,
            Long projectId,
            SalesRangePreset rangePreset,
            boolean compareEnabled,
            String search,
            SalesOrderSort sort,
            SalesOrderFilter filter,
            Integer page,
            Integer size
    ) {
        Project project = getAccessibleProject(email, projectId);
        ResolvedRange currentRange = resolveRange(rangePreset);
        ResolvedRange comparisonRange = currentRange.previous();

        List<ProjectOrder> currentOrders = loadOrders(project.getId(), currentRange);
        List<ProjectOrder> comparisonOrders = compareEnabled ? loadOrders(project.getId(), comparisonRange) : List.of();

        return ProjectSalesPageDto.builder()
                .currencyCode(DEFAULT_CURRENCY)
                .rangePreset(rangePreset)
                .rangeStart(Objects.toString(currentRange.startInclusive(), null))
                .rangeEndExclusive(Objects.toString(currentRange.endExclusive(), null))
                .compareEnabled(compareEnabled)
                .comparisonRangeStart(compareEnabled ? Objects.toString(comparisonRange.startInclusive(), null) : null)
                .comparisonRangeEndExclusive(compareEnabled ? Objects.toString(comparisonRange.endExclusive(), null) : null)
                .summary(buildSummary(currentOrders, comparisonOrders, currentRange, comparisonRange, compareEnabled))
                .chartPoints(buildChartPoints(currentOrders, currentRange))
                .deliveryStats(buildDeliveryStats(currentOrders))
                .topProducts(buildTopProducts(currentOrders, comparisonOrders))
                .orders(buildOrdersPage(currentOrders, search, sort, filter, page, size))
                .hasData(!currentOrders.isEmpty())
                .build();
    }

    public byte[] exportOrdersCsv(
            String email,
            Long projectId,
            SalesRangePreset rangePreset,
            String search,
            SalesOrderSort sort,
            SalesOrderFilter filter
    ) {
        Project project = getAccessibleProject(email, projectId);
        List<ProjectOrder> orders = applyOrderFilters(loadOrders(project.getId(), resolveRange(rangePreset)), search, filter, sort);

        StringBuilder csv = new StringBuilder();
        csv.append("order_number,placed_at,customer,payment_status,fulfillment_status,total,currency")
                .append(System.lineSeparator());

        for (ProjectOrder order : orders) {
            csv.append(csvValue(order.getOrderNumber())).append(',')
                    .append(csvValue(order.getPlacedAt() != null ? CSV_DATE_FORMATTER.format(order.getPlacedAt()) : "")).append(',')
                    .append(csvValue(customerName(order))).append(',')
                    .append(csvValue(order.getPaymentStatus().name())).append(',')
                    .append(csvValue(order.getFulfillmentStatus().name())).append(',')
                    .append(csvValue(amount(order.getTotal()).toPlainString())).append(',')
                    .append(csvValue(DEFAULT_CURRENCY))
                    .append(System.lineSeparator());
        }

        return csv.toString().getBytes(StandardCharsets.UTF_8);
    }

    public ProjectSalesOrderEditorDto getOrder(String email, Long projectId, Long orderId) {
        getAccessibleProject(email, projectId);
        return mapOrderEditorDto(getOwnedOrder(projectId, orderId));
    }

    @Transactional
    public ProjectSalesOrderEditorDto createOrder(String email, Long projectId, CreateProjectOrderRequest request) {
        Project project = getEditableProject(email, projectId);

        ProjectOrder order = new ProjectOrder();
        order.setProject(project);
        applyOrderRequest(order, projectId, request);

        return mapOrderEditorDto(projectOrderRepository.save(order));
    }

    @Transactional
    public ProjectSalesOrderEditorDto updateOrder(
            String email,
            Long projectId,
            Long orderId,
            UpdateProjectOrderRequest request
    ) {
        getEditableProject(email, projectId);
        ProjectOrder order = getOwnedOrder(projectId, orderId);
        applyOrderRequest(order, projectId, request);
        return mapOrderEditorDto(projectOrderRepository.save(order));
    }

    @Transactional
    public void deleteOrders(String email, Long projectId, List<Long> orderIds) {
        getEditableProject(email, projectId);
        if (orderIds == null || orderIds.isEmpty()) {
            throw new RuntimeException("At least one order must be selected.");
        }

        List<ProjectOrder> orders = projectOrderRepository.findAllByIdInAndProjectId(orderIds, projectId);
        if (orders.size() != orderIds.size()) {
            throw new RuntimeException("One or more selected orders were not found.");
        }

        projectOrderRepository.deleteAllInBatch(orders);
    }

    private List<ProjectOrder> loadOrders(Long projectId, ResolvedRange range) {
        return projectOrderRepository.findAllByProjectIdAndPlacedAtGreaterThanEqualAndPlacedAtLessThanOrderByPlacedAtDesc(
                projectId,
                range.startInclusive(),
                range.endExclusive()
        );
    }

    private void applyOrderRequest(ProjectOrder order, Long projectId, CreateProjectOrderRequest request) {
        ProjectCustomer customer = request.getCustomerId() != null
                ? projectCustomerRepository.findByIdAndProjectId(request.getCustomerId(), projectId)
                    .orElseThrow(() -> new RuntimeException("Customer not found"))
                : null;

        OrderPaymentStatus paymentStatus = parsePaymentStatus(request.getPaymentStatus());
        OrderFulfillmentStatus fulfillmentStatus = parseFulfillmentStatus(request.getFulfillmentStatus());

        List<ProjectOrderItem> orderItems = new ArrayList<>();
        BigDecimal subtotal = BigDecimal.ZERO;

        for (ProjectSalesOrderItemInputDto itemRequest : request.getItems()) {
            if (itemRequest.getQuantity() == null || itemRequest.getQuantity() < 1) {
                throw new RuntimeException("Each item must include a valid quantity.");
            }
            if (itemRequest.getUnitPrice() == null || itemRequest.getUnitPrice().compareTo(BigDecimal.ZERO) < 0) {
                throw new RuntimeException("Each item must include a valid unit price.");
            }

            ProjectProduct product = itemRequest.getProductId() != null
                    ? projectProductRepository.findByIdAndProjectId(itemRequest.getProductId(), projectId)
                        .orElseThrow(() -> new RuntimeException("Product not found"))
                    : null;

            String productName = product != null
                    ? product.getName()
                    : requireValue(itemRequest.getProductName(), "Each item needs a product name.");
            String productSku = product != null ? product.getSku() : blankToNull(itemRequest.getProductSku());
            BigDecimal unitPrice = amount(itemRequest.getUnitPrice());
            BigDecimal lineTotal = amount(unitPrice.multiply(BigDecimal.valueOf(itemRequest.getQuantity())));

            ProjectOrderItem orderItem = ProjectOrderItem.builder()
                    .order(order)
                    .product(product)
                    .productName(productName)
                    .productSku(productSku)
                    .quantity(itemRequest.getQuantity())
                    .unitPrice(unitPrice)
                    .lineTotal(lineTotal)
                    .build();

            orderItems.add(orderItem);
            subtotal = subtotal.add(lineTotal);
        }

        BigDecimal deliveryFee = amount(request.getDeliveryFee());
        BigDecimal total = amount(subtotal.add(deliveryFee));

        order.setCustomer(customer);
        order.setOrderNumber(requireValue(request.getOrderNumber(), "Order number is required."));
        order.setPlacedAt(Objects.requireNonNull(request.getPlacedAt(), "Placed date is required."));
        order.setScheduledFor(request.getScheduledFor());
        order.setDeliveredAt(request.getDeliveredAt());
        order.setPaymentStatus(paymentStatus);
        order.setFulfillmentStatus(fulfillmentStatus);
        order.setSubtotal(amount(subtotal));
        order.setDeliveryFee(deliveryFee);
        order.setTotal(total);
        order.setDeliveryAddress(blankToNull(request.getDeliveryAddress()));
        order.setNotes(blankToNull(request.getNotes()));
        order.getItems().clear();
        order.getItems().addAll(orderItems);
    }

    private ProjectSalesSummaryDto buildSummary(
            List<ProjectOrder> currentOrders,
            List<ProjectOrder> comparisonOrders,
            ResolvedRange currentRange,
            ResolvedRange comparisonRange,
            boolean compareEnabled
    ) {
        BigDecimal currentRevenue = sumRevenue(currentOrders);
        BigDecimal comparisonRevenue = sumRevenue(comparisonOrders);
        long currentOrderCount = currentOrders.size();
        long comparisonOrderCount = comparisonOrders.size();
        BigDecimal currentAverage = averageOrderValue(currentOrders);
        BigDecimal comparisonAverage = averageOrderValue(comparisonOrders);
        long currentAwaitingDelivery = currentOrders.stream().filter(this::isAwaitingDelivery).count();
        long comparisonAwaitingDelivery = comparisonOrders.stream().filter(this::isAwaitingDelivery).count();
        long deliveredCurrent = deliveredCount(currentOrders, currentRange);
        long deliveredComparison = deliveredCount(comparisonOrders, comparisonRange);
        double averageDeliveryDaysCurrent = averageDeliveryDays(currentOrders, currentRange);
        double averageDeliveryDaysComparison = averageDeliveryDays(comparisonOrders, comparisonRange);

        return ProjectSalesSummaryDto.builder()
                .revenue(currentRevenue)
                .revenueChangePercent(compareEnabled ? percentageChange(currentRevenue, comparisonRevenue) : 0)
                .orders(currentOrderCount)
                .ordersChangePercent(compareEnabled ? percentageChange(BigDecimal.valueOf(currentOrderCount), BigDecimal.valueOf(comparisonOrderCount)) : 0)
                .averageOrderValue(currentAverage)
                .averageOrderValueChangePercent(compareEnabled ? percentageChange(currentAverage, comparisonAverage) : 0)
                .awaitingDelivery(currentAwaitingDelivery)
                .awaitingDeliveryChange(compareEnabled ? currentAwaitingDelivery - comparisonAwaitingDelivery : 0)
                .delivered(deliveredCurrent)
                .deliveredChangePercent(compareEnabled ? percentageChange(BigDecimal.valueOf(deliveredCurrent), BigDecimal.valueOf(deliveredComparison)) : 0)
                .averageDeliveryDays(roundDouble(averageDeliveryDaysCurrent))
                .averageDeliveryDaysChange(compareEnabled ? roundDouble(averageDeliveryDaysCurrent - averageDeliveryDaysComparison) : 0)
                .build();
    }

    private List<ProjectSalesChartPointDto> buildChartPoints(List<ProjectOrder> currentOrders, ResolvedRange currentRange) {
        Map<LocalDate, List<ProjectOrder>> groupedOrders = currentOrders.stream()
                .collect(Collectors.groupingBy(order -> order.getPlacedAt().toLocalDate()));

        List<ProjectSalesChartPointDto> points = new ArrayList<>();
        LocalDate cursor = currentRange.startInclusive().toLocalDate();
        LocalDate endDate = currentRange.endExclusive().toLocalDate();

        while (cursor.isBefore(endDate)) {
            List<ProjectOrder> ordersForDate = groupedOrders.getOrDefault(cursor, List.of());
            points.add(ProjectSalesChartPointDto.builder()
                    .isoDate(cursor.toString())
                    .label(CHART_LABEL_FORMATTER.format(cursor))
                    .revenue(sumRevenue(ordersForDate))
                    .orders(ordersForDate.size())
                    .build());
            cursor = cursor.plusDays(1);
        }

        return points;
    }

    private List<ProjectSalesDeliveryStatDto> buildDeliveryStats(List<ProjectOrder> currentOrders) {
        LocalDate today = LocalDate.now();
        long newToday = currentOrders.stream()
                .filter(order -> order.getPlacedAt() != null && order.getPlacedAt().toLocalDate().isEqual(today))
                .count();
        long packing = currentOrders.stream()
                .filter(order -> order.getFulfillmentStatus() == OrderFulfillmentStatus.PACKING)
                .count();
        long outForDelivery = currentOrders.stream()
                .filter(order -> order.getFulfillmentStatus() == OrderFulfillmentStatus.OUT_FOR_DELIVERY)
                .count();
        long localZones = currentOrders.stream()
                .map(ProjectOrder::getCustomer)
                .filter(Objects::nonNull)
                .map(ProjectCustomer::getZoneLabel)
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(value -> !value.isEmpty())
                .distinct()
                .count();

        return List.of(
                ProjectSalesDeliveryStatDto.builder().label("New today").value(newToday).note("Fresh orders to confirm with customers before routing.").build(),
                ProjectSalesDeliveryStatDto.builder().label("Packed").value(packing).note("Orders prepared and ready for the next delivery run.").build(),
                ProjectSalesDeliveryStatDto.builder().label("Out for delivery").value(outForDelivery).note("Orders already assigned to local handoff or delivery.").build(),
                ProjectSalesDeliveryStatDto.builder().label("Local zones").value(localZones).note("Unique delivery areas represented in the selected period.").build()
        );
    }

    private List<ProjectSalesTopProductDto> buildTopProducts(List<ProjectOrder> currentOrders, List<ProjectOrder> comparisonOrders) {
        Map<String, ProductAggregate> current = aggregateProducts(currentOrders);
        Map<String, ProductAggregate> previous = aggregateProducts(comparisonOrders);
        Comparator<ProductAggregate> rankingComparator = Comparator
                .comparing(ProductAggregate::revenue, Comparator.reverseOrder())
                .thenComparing(Comparator.comparingInt(ProductAggregate::units).reversed());

        return current.values().stream()
                .sorted(rankingComparator)
                .limit(4)
                .map(aggregate -> {
                    ProductAggregate previousAggregate = previous.get(aggregate.key());
                    return ProjectSalesTopProductDto.builder()
                            .productId(aggregate.productId())
                            .name(aggregate.name())
                            .sku(aggregate.sku())
                            .revenue(aggregate.revenue())
                            .units(aggregate.units())
                            .growthPercent(percentageChange(aggregate.revenue(), previousAggregate != null ? previousAggregate.revenue() : BigDecimal.ZERO))
                            .build();
                })
                .toList();
    }

    private ProjectSalesOrdersPageDto buildOrdersPage(List<ProjectOrder> currentOrders, String search, SalesOrderSort sort, SalesOrderFilter filter, Integer page, Integer size) {
        int safeSize = Math.max(1, Math.min(size == null ? DEFAULT_PAGE_SIZE : size, MAX_PAGE_SIZE));
        int requestedPage = Math.max(page == null ? 0 : page, 0);
        List<ProjectSalesOrderRowDto> allItems = currentOrders.stream()
                .map(order -> ProjectSalesOrderRowDto.builder()
                        .id(order.getId())
                        .orderNumber(order.getOrderNumber())
                        .customerName(customerName(order))
                        .placedAt(Objects.toString(order.getPlacedAt(), null))
                        .paymentStatus(order.getPaymentStatus().name())
                        .fulfillmentStatus(order.getFulfillmentStatus().name())
                        .total(amount(order.getTotal()))
                        .build())
                .toList();
        List<ProjectOrder> filteredOrders = applyOrderFilters(currentOrders, search, filter, sort);

        int totalPages = filteredOrders.isEmpty() ? 0 : (int) Math.ceil((double) filteredOrders.size() / safeSize);
        int safePage = totalPages == 0 ? 0 : Math.min(requestedPage, totalPages - 1);
        int fromIndex = Math.min(safePage * safeSize, filteredOrders.size());
        int toIndex = Math.min(fromIndex + safeSize, filteredOrders.size());

        List<ProjectSalesOrderRowDto> items = filteredOrders.subList(fromIndex, toIndex).stream()
                .map(order -> ProjectSalesOrderRowDto.builder()
                        .id(order.getId())
                        .orderNumber(order.getOrderNumber())
                        .customerName(customerName(order))
                        .placedAt(Objects.toString(order.getPlacedAt(), null))
                        .paymentStatus(order.getPaymentStatus().name())
                        .fulfillmentStatus(order.getFulfillmentStatus().name())
                        .total(amount(order.getTotal()))
                        .build())
                .toList();

        return ProjectSalesOrdersPageDto.builder()
                .allItems(allItems)
                .items(items)
                .page(safePage)
                .size(safeSize)
                .totalElements(filteredOrders.size())
                .totalPages(totalPages)
                .search(search == null ? "" : search.trim())
                .sort(sort)
                .filter(filter)
                .build();
    }

    private List<ProjectOrder> applyOrderFilters(List<ProjectOrder> orders, String search, SalesOrderFilter filter, SalesOrderSort sort) {
        Predicate<ProjectOrder> searchPredicate = buildSearchPredicate(search);
        Predicate<ProjectOrder> statusPredicate = buildStatusPredicate(filter);

        Comparator<ProjectOrder> comparator = switch (sort) {
            case PLACED_AT_ASC -> Comparator.comparing(ProjectOrder::getPlacedAt, Comparator.nullsLast(Comparator.naturalOrder()));
            case TOTAL_DESC -> Comparator.comparing(ProjectOrder::getTotal, Comparator.nullsLast(Comparator.naturalOrder())).reversed();
            case TOTAL_ASC -> Comparator.comparing(ProjectOrder::getTotal, Comparator.nullsLast(Comparator.naturalOrder()));
            case PLACED_AT_DESC -> Comparator.comparing(ProjectOrder::getPlacedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed();
        };

        return orders.stream().filter(searchPredicate).filter(statusPredicate).sorted(comparator).toList();
    }

    private Predicate<ProjectOrder> buildSearchPredicate(String search) {
        if (search == null || search.isBlank()) {
            return order -> true;
        }

        String normalized = search.trim().toLowerCase(Locale.ROOT);
        return order -> order.getOrderNumber().toLowerCase(Locale.ROOT).contains(normalized)
                || customerName(order).toLowerCase(Locale.ROOT).contains(normalized);
    }

    private Predicate<ProjectOrder> buildStatusPredicate(SalesOrderFilter filter) {
        return switch (filter) {
            case ACTIVE -> this::isAwaitingDelivery;
            case DELIVERED -> order -> order.getFulfillmentStatus() == OrderFulfillmentStatus.DELIVERED;
            case DUE_ON_DELIVERY -> order -> order.getPaymentStatus() == OrderPaymentStatus.DUE_ON_DELIVERY;
            case ALL -> order -> true;
        };
    }

    private Map<String, ProductAggregate> aggregateProducts(List<ProjectOrder> orders) {
        Map<String, ProductAggregate> aggregates = new LinkedHashMap<>();

        for (ProjectOrder order : orders) {
            for (ProjectOrderItem item : order.getItems()) {
                String key = itemKey(item);
                ProductAggregate current = aggregates.getOrDefault(key, new ProductAggregate(item.getProduct() != null ? item.getProduct().getId() : null, key, item.getProductName(), item.getProductSku(), BigDecimal.ZERO, 0));

                aggregates.put(key, new ProductAggregate(
                        current.productId(),
                        current.key(),
                        current.name(),
                        current.sku(),
                        amount(current.revenue().add(amount(item.getLineTotal()))),
                        current.units() + (item.getQuantity() == null ? 0 : item.getQuantity())
                ));
            }
        }

        return aggregates;
    }

    private BigDecimal sumRevenue(List<ProjectOrder> orders) {
        return amount(orders.stream().map(ProjectOrder::getTotal).filter(Objects::nonNull).reduce(BigDecimal.ZERO, BigDecimal::add));
    }

    private BigDecimal averageOrderValue(List<ProjectOrder> orders) {
        if (orders.isEmpty()) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }

        return amount(sumRevenue(orders).divide(BigDecimal.valueOf(orders.size()), 2, RoundingMode.HALF_UP));
    }

    private long deliveredCount(List<ProjectOrder> orders, ResolvedRange range) {
        return orders.stream()
                .filter(order -> order.getDeliveredAt() != null)
                .filter(order -> !order.getDeliveredAt().isBefore(range.startInclusive()) && order.getDeliveredAt().isBefore(range.endExclusive()))
                .count();
    }

    private double averageDeliveryDays(List<ProjectOrder> orders, ResolvedRange range) {
        List<ProjectOrder> deliveredOrders = orders.stream()
                .filter(order -> order.getPlacedAt() != null && order.getDeliveredAt() != null)
                .filter(order -> !order.getDeliveredAt().isBefore(range.startInclusive()) && order.getDeliveredAt().isBefore(range.endExclusive()))
                .toList();

        if (deliveredOrders.isEmpty()) {
            return 0;
        }

        double averageHours = deliveredOrders.stream().mapToLong(order -> Duration.between(order.getPlacedAt(), order.getDeliveredAt()).toHours()).average().orElse(0);
        return averageHours / 24d;
    }

    private double percentageChange(BigDecimal current, BigDecimal previous) {
        if (previous == null || previous.compareTo(BigDecimal.ZERO) == 0) {
            return current != null && current.compareTo(BigDecimal.ZERO) > 0 ? 100 : 0;
        }

        BigDecimal delta = current.subtract(previous).multiply(BigDecimal.valueOf(100)).divide(previous, 2, RoundingMode.HALF_UP);
        return roundDouble(delta.doubleValue());
    }

    private boolean isAwaitingDelivery(ProjectOrder order) {
        return switch (order.getFulfillmentStatus()) {
            case NEW, PACKING, SCHEDULED, OUT_FOR_DELIVERY -> true;
            case DELIVERED, CANCELLED -> false;
        };
    }

    private BigDecimal amount(BigDecimal value) {
        return (value == null ? BigDecimal.ZERO : value).setScale(2, RoundingMode.HALF_UP);
    }

    private double roundDouble(double value) {
        return Math.round(value * 100d) / 100d;
    }

    private String customerName(ProjectOrder order) {
        if (order.getCustomer() == null) {
            return "Guest customer";
        }

        String first = Optional.ofNullable(order.getCustomer().getFirstName()).orElse("").trim();
        String last = Optional.ofNullable(order.getCustomer().getLastName()).orElse("").trim();
        String fullName = (first + " " + last).trim();
        return fullName.isEmpty() ? "Guest customer" : fullName;
    }

    private ProjectSalesOrderEditorDto mapOrderEditorDto(ProjectOrder order) {
        return ProjectSalesOrderEditorDto.builder()
                .id(order.getId())
                .customerId(order.getCustomer() != null ? order.getCustomer().getId() : null)
                .orderNumber(order.getOrderNumber())
                .customerName(customerName(order))
                .placedAt(Objects.toString(order.getPlacedAt(), null))
                .scheduledFor(Objects.toString(order.getScheduledFor(), null))
                .deliveredAt(Objects.toString(order.getDeliveredAt(), null))
                .paymentStatus(order.getPaymentStatus().name())
                .fulfillmentStatus(order.getFulfillmentStatus().name())
                .subtotal(amount(order.getSubtotal()))
                .deliveryFee(amount(order.getDeliveryFee()))
                .total(amount(order.getTotal()))
                .deliveryAddress(order.getDeliveryAddress())
                .notes(order.getNotes())
                .items(order.getItems().stream()
                        .map(item -> ProjectSalesOrderItemEditorDto.builder()
                                .id(item.getId())
                                .productId(item.getProduct() != null ? item.getProduct().getId() : null)
                                .productName(item.getProductName())
                                .productSku(item.getProductSku())
                                .quantity(item.getQuantity())
                                .unitPrice(amount(item.getUnitPrice()))
                                .lineTotal(amount(item.getLineTotal()))
                                .build())
                        .toList())
                .build();
    }

    private ProjectOrder getOwnedOrder(Long projectId, Long orderId) {
        return projectOrderRepository.findByIdAndProjectId(orderId, projectId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
    }

    private String requireValue(String value, String message) {
        String trimmed = blankToNull(value);
        if (trimmed == null) {
            throw new RuntimeException(message);
        }
        return trimmed;
    }

    private String blankToNull(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private OrderPaymentStatus parsePaymentStatus(String value) {
        try {
            return OrderPaymentStatus.valueOf(requireValue(value, "Payment status is required.").toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new RuntimeException("Invalid payment status.");
        }
    }

    private OrderFulfillmentStatus parseFulfillmentStatus(String value) {
        try {
            return OrderFulfillmentStatus.valueOf(requireValue(value, "Fulfillment status is required.").toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new RuntimeException("Invalid fulfillment status.");
        }
    }

    private String itemKey(ProjectOrderItem item) {
        if (item.getProduct() != null && item.getProduct().getId() != null) {
            return "product:" + item.getProduct().getId();
        }

        return "name:" + Optional.ofNullable(item.getProductName()).orElse("unknown").trim().toLowerCase(Locale.ROOT);
    }

    private String csvValue(String value) {
        String safe = value == null ? "" : value.replace("\"", "\"\"");
        return "\"" + safe + "\"";
    }

    private Project getOwnedProject(String email, Long projectId) {
        return projectAccessService.getAccessibleProject(email, projectId);
    }

    private Project getAccessibleProject(String email, Long projectId) {
        return projectAccessService.getAccessibleProject(email, projectId);
    }

    private Project getEditableProject(String email, Long projectId) {
        return projectAccessService.getEditableProject(email, projectId);
    }

    private ResolvedRange resolveRange(SalesRangePreset rangePreset) {
        LocalDate today = LocalDate.now();
        return switch (rangePreset) {
            case THIS_WEEK -> new ResolvedRange(today.with(DayOfWeek.MONDAY).atStartOfDay(), today.plusDays(1).atStartOfDay());
            case THIS_MONTH -> new ResolvedRange(today.withDayOfMonth(1).atStartOfDay(), today.plusDays(1).atStartOfDay());
            case LAST_90_DAYS -> new ResolvedRange(today.minusDays(89).atStartOfDay(), today.plusDays(1).atStartOfDay());
            case LAST_30_DAYS -> new ResolvedRange(today.minusDays(29).atStartOfDay(), today.plusDays(1).atStartOfDay());
        };
    }

    private record ResolvedRange(LocalDateTime startInclusive, LocalDateTime endExclusive) {
        ResolvedRange previous() {
            Duration duration = Duration.between(startInclusive, endExclusive);
            return new ResolvedRange(startInclusive.minus(duration), startInclusive);
        }
    }

    private record ProductAggregate(Long productId, String key, String name, String sku, BigDecimal revenue, int units) {
    }
}
