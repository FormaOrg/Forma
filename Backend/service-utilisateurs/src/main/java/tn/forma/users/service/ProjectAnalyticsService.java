package tn.forma.users.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.forma.users.dto.*;
import tn.forma.users.model.*;
import tn.forma.users.repository.ProjectAnalyticsEventRepository;
import tn.forma.users.repository.ProjectCustomerRepository;
import tn.forma.users.repository.ProjectOrderRepository;
import tn.forma.users.repository.ProjectRepository;
import tn.forma.users.repository.UserRepository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.NumberFormat;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProjectAnalyticsService {

    private static final DateTimeFormatter CHART_LABEL_FORMATTER = DateTimeFormatter.ofPattern("MMM dd", Locale.ENGLISH);

    private final ProjectRepository projectRepository;
    private final ProjectOrderRepository projectOrderRepository;
    private final ProjectCustomerRepository projectCustomerRepository;
    private final ProjectAnalyticsEventRepository projectAnalyticsEventRepository;
    private final UserRepository userRepository;

    public ProjectAnalyticsPageDto getAnalyticsPage(String email, Long projectId, AnalyticsRangePreset rangePreset) {
        Project project = getOwnedProject(email, projectId);
        ResolvedRange currentRange = resolveRange(rangePreset);
        ResolvedRange previousRange = currentRange.previous();

        if (project.getType() == ProjectType.PORTFOLIO) {
            return buildPortfolioAnalyticsPage(project, rangePreset, currentRange, previousRange);
        }

        return buildEcommerceAnalyticsPage(project, rangePreset, currentRange, previousRange);
    }

    private ProjectAnalyticsPageDto buildEcommerceAnalyticsPage(
            Project project,
            AnalyticsRangePreset rangePreset,
            ResolvedRange currentRange,
            ResolvedRange previousRange
    ) {
        List<ProjectOrder> currentOrders = loadOrders(project.getId(), currentRange);
        List<ProjectOrder> previousOrders = loadOrders(project.getId(), previousRange);

        List<ProjectCustomer> allCustomers = projectCustomerRepository.findAllByProjectIdOrderByCreatedAtDesc(project.getId());
        List<ProjectCustomer> currentCustomers = filterCustomersByRange(allCustomers, currentRange);
        List<ProjectCustomer> previousCustomers = filterCustomersByRange(allCustomers, previousRange);

        BigDecimal currentRevenue = sumRevenue(currentOrders);
        BigDecimal previousRevenue = sumRevenue(previousOrders);
        BigDecimal currentAverage = averageOrderValue(currentOrders);
        BigDecimal previousAverage = averageOrderValue(previousOrders);

        return ProjectAnalyticsPageDto.builder()
                .kind(ProjectAnalyticsKind.ECOMMERCE)
                .rangePreset(rangePreset)
                .rangeStart(Objects.toString(currentRange.startInclusive(), null))
                .rangeEndExclusive(Objects.toString(currentRange.endExclusive(), null))
                .summaryCards(List.of(
                        summaryCard("customers", "Customers", formatInteger(currentCustomers.size()), percentageChange(BigDecimal.valueOf(currentCustomers.size()), BigDecimal.valueOf(previousCustomers.size())), "violet", "customers"),
                        summaryCard("orders", "Orders", formatInteger(currentOrders.size()), percentageChange(BigDecimal.valueOf(currentOrders.size()), BigDecimal.valueOf(previousOrders.size())), "blue", "orders"),
                        summaryCard("revenue", "Revenue", formatCurrency(currentRevenue), percentageChange(currentRevenue, previousRevenue), "mint", "revenue"),
                        summaryCard("averageOrderValue", "Average order value", formatCurrency(currentAverage), percentageChange(currentAverage, previousAverage), "amber", "average")
                ))
                .metricOptions(List.of(
                        metricOption("customers", "Customers", ProjectAnalyticsMetricFormat.NUMBER),
                        metricOption("orders", "Orders", ProjectAnalyticsMetricFormat.NUMBER),
                        metricOption("revenue", "Revenue", ProjectAnalyticsMetricFormat.CURRENCY)
                ))
                .chartHeading(sectionHeading("Performance over time", "Main trend"))
                .chartPoints(buildEcommerceChartPoints(currentCustomers, currentOrders, currentRange))
                .breakdownHeading(sectionHeading("Acquisition", "Customer zones"))
                .breakdownItems(buildZoneBreakdown(currentCustomers, currentOrders))
                .primaryListHeading(sectionHeading("Customer performance", "Top customers"))
                .primaryListItems(buildTopCustomerItems(currentOrders, previousOrders))
                .secondaryListHeading(sectionHeading("Commerce snapshot", "Top products"))
                .secondaryListItems(buildTopProductItems(currentOrders, previousOrders))
                .insightsHeading(sectionHeading("Key takeaways", "What stands out right now"))
                .insights(buildEcommerceInsights(currentCustomers, currentOrders))
                .hasData(!currentOrders.isEmpty() || !currentCustomers.isEmpty())
                .build();
    }

    private ProjectAnalyticsPageDto buildPortfolioAnalyticsPage(
            Project project,
            AnalyticsRangePreset rangePreset,
            ResolvedRange currentRange,
            ResolvedRange previousRange
    ) {
        List<ProjectAnalyticsEvent> currentEvents = loadEvents(project.getId(), currentRange);
        List<ProjectAnalyticsEvent> previousEvents = loadEvents(project.getId(), previousRange);

        List<ProjectAnalyticsEvent> currentPageViews = filterEventsByType(currentEvents, ProjectAnalyticsEventType.PAGE_VIEW);
        List<ProjectAnalyticsEvent> previousPageViews = filterEventsByType(previousEvents, ProjectAnalyticsEventType.PAGE_VIEW);
        List<ProjectAnalyticsEvent> currentInquiries = filterEventsByType(currentEvents, ProjectAnalyticsEventType.INQUIRY_SUBMITTED);
        List<ProjectAnalyticsEvent> previousInquiries = filterEventsByType(previousEvents, ProjectAnalyticsEventType.INQUIRY_SUBMITTED);

        long currentVisitors = countDistinctVisitors(currentPageViews);
        long previousVisitors = countDistinctVisitors(previousPageViews);
        long currentPageViewCount = currentPageViews.size();
        long previousPageViewCount = previousPageViews.size();
        long currentInquiryCount = currentInquiries.size();
        long previousInquiryCount = previousInquiries.size();
        double currentInquiryRate = calculateRate(currentInquiryCount, currentVisitors);
        double previousInquiryRate = calculateRate(previousInquiryCount, previousVisitors);

        return ProjectAnalyticsPageDto.builder()
                .kind(ProjectAnalyticsKind.PORTFOLIO)
                .rangePreset(rangePreset)
                .rangeStart(Objects.toString(currentRange.startInclusive(), null))
                .rangeEndExclusive(Objects.toString(currentRange.endExclusive(), null))
                .summaryCards(List.of(
                        summaryCard("visitors", "Visitors", formatInteger(currentVisitors), percentageChange(BigDecimal.valueOf(currentVisitors), BigDecimal.valueOf(previousVisitors)), "violet", "visitors"),
                        summaryCard("pageViews", "Page views", formatInteger(currentPageViewCount), percentageChange(BigDecimal.valueOf(currentPageViewCount), BigDecimal.valueOf(previousPageViewCount)), "blue", "pageViews"),
                        summaryCard("inquiries", "Inquiries", formatInteger(currentInquiryCount), percentageChange(BigDecimal.valueOf(currentInquiryCount), BigDecimal.valueOf(previousInquiryCount)), "mint", "inquiries"),
                        summaryCard("inquiryRate", "Inquiry rate", formatPercent(currentInquiryRate), roundDouble(currentInquiryRate - previousInquiryRate), "amber", "conversion")
                ))
                .metricOptions(List.of(
                        metricOption("visitors", "Visitors", ProjectAnalyticsMetricFormat.NUMBER),
                        metricOption("pageViews", "Page views", ProjectAnalyticsMetricFormat.NUMBER),
                        metricOption("inquiries", "Inquiries", ProjectAnalyticsMetricFormat.NUMBER)
                ))
                .chartHeading(sectionHeading("Portfolio momentum", "Audience trend"))
                .chartPoints(buildPortfolioChartPoints(currentEvents, currentRange))
                .breakdownHeading(sectionHeading("Acquisition", "Traffic sources"))
                .breakdownItems(buildTrafficSourceBreakdown(currentPageViews))
                .primaryListHeading(sectionHeading("Content performance", "Top pages"))
                .primaryListItems(buildTopPageItems(currentPageViews))
                .secondaryListHeading(sectionHeading("Audience split", "Devices"))
                .secondaryListItems(buildDeviceItems(currentPageViews))
                .insightsHeading(sectionHeading("Key takeaways", "What stands out right now"))
                .insights(buildPortfolioInsights(currentPageViews, currentInquiries))
                .hasData(!currentEvents.isEmpty())
                .build();
    }

    private List<ProjectAnalyticsChartPointDto> buildEcommerceChartPoints(
            List<ProjectCustomer> currentCustomers,
            List<ProjectOrder> currentOrders,
            ResolvedRange currentRange
    ) {
        Map<LocalDate, Long> customersByDay = currentCustomers.stream()
                .filter(customer -> customer.getCreatedAt() != null)
                .collect(Collectors.groupingBy(customer -> customer.getCreatedAt().toLocalDate(), Collectors.counting()));

        Map<LocalDate, List<ProjectOrder>> ordersByDay = currentOrders.stream()
                .collect(Collectors.groupingBy(order -> order.getPlacedAt().toLocalDate()));

        List<ProjectAnalyticsChartPointDto> points = new ArrayList<>();
        LocalDate cursor = currentRange.startInclusive().toLocalDate();
        LocalDate endDate = currentRange.endExclusive().toLocalDate();

        while (cursor.isBefore(endDate)) {
            List<ProjectOrder> ordersForDate = ordersByDay.getOrDefault(cursor, List.of());
            points.add(chartPoint(
                    cursor,
                    metricValue("customers", customersByDay.getOrDefault(cursor, 0L)),
                    metricValue("orders", ordersForDate.size()),
                    metricValue("revenue", sumRevenue(ordersForDate).doubleValue())
            ));
            cursor = cursor.plusDays(1);
        }

        return points;
    }

    private List<ProjectAnalyticsChartPointDto> buildPortfolioChartPoints(
            List<ProjectAnalyticsEvent> currentEvents,
            ResolvedRange currentRange
    ) {
        Map<LocalDate, List<ProjectAnalyticsEvent>> eventsByDay = currentEvents.stream()
                .collect(Collectors.groupingBy(event -> event.getOccurredAt().toLocalDate()));

        List<ProjectAnalyticsChartPointDto> points = new ArrayList<>();
        LocalDate cursor = currentRange.startInclusive().toLocalDate();
        LocalDate endDate = currentRange.endExclusive().toLocalDate();

        while (cursor.isBefore(endDate)) {
            List<ProjectAnalyticsEvent> eventsForDate = eventsByDay.getOrDefault(cursor, List.of());
            List<ProjectAnalyticsEvent> pageViews = filterEventsByType(eventsForDate, ProjectAnalyticsEventType.PAGE_VIEW);
            List<ProjectAnalyticsEvent> inquiries = filterEventsByType(eventsForDate, ProjectAnalyticsEventType.INQUIRY_SUBMITTED);

            points.add(chartPoint(
                    cursor,
                    metricValue("visitors", countDistinctVisitors(pageViews)),
                    metricValue("pageViews", pageViews.size()),
                    metricValue("inquiries", inquiries.size())
            ));
            cursor = cursor.plusDays(1);
        }

        return points;
    }

    private List<ProjectAnalyticsBreakdownItemDto> buildZoneBreakdown(List<ProjectCustomer> currentCustomers, List<ProjectOrder> currentOrders) {
        Map<String, Long> counts = new LinkedHashMap<>();

        currentCustomers.stream()
                .map(ProjectCustomer::getZoneLabel)
                .map(this::normalizeZone)
                .forEach(label -> counts.merge(label, 1L, Long::sum));

        if (counts.isEmpty()) {
            currentOrders.stream()
                    .map(ProjectOrder::getCustomer)
                    .filter(Objects::nonNull)
                    .map(ProjectCustomer::getZoneLabel)
                    .map(this::normalizeZone)
                    .forEach(label -> counts.merge(label, 1L, Long::sum));
        }

        long total = counts.values().stream().mapToLong(Long::longValue).sum();
        if (total == 0) {
            return List.of(
                    ProjectAnalyticsBreakdownItemDto.builder()
                            .label("No customer zones yet")
                            .value(0)
                            .percentage(0)
                            .note("Zone insights will appear as soon as customers are saved with location details.")
                            .build()
            );
        }

        return counts.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(4)
                .map(entry -> breakdownItem(
                        entry.getKey(),
                        entry.getValue(),
                        (entry.getValue() * 100d) / total,
                        entry.getValue() == 1
                                ? "1 customer recorded in this zone during the selected period."
                                : entry.getValue() + " customers recorded in this zone during the selected period."
                ))
                .toList();
    }

    private List<ProjectAnalyticsBreakdownItemDto> buildTrafficSourceBreakdown(List<ProjectAnalyticsEvent> pageViews) {
        Map<ProjectAnalyticsSourceType, Long> counts = pageViews.stream()
                .collect(Collectors.groupingBy(ProjectAnalyticsEvent::getSourceType, LinkedHashMap::new, Collectors.counting()));

        long total = counts.values().stream().mapToLong(Long::longValue).sum();
        if (total == 0) {
            return List.of(
                    ProjectAnalyticsBreakdownItemDto.builder()
                            .label("No traffic sources yet")
                            .value(0)
                            .percentage(0)
                            .note("Track page views on the live portfolio and source signals will start to appear here.")
                            .build()
            );
        }

        return counts.entrySet().stream()
                .sorted(Map.Entry.<ProjectAnalyticsSourceType, Long>comparingByValue().reversed())
                .limit(4)
                .map(entry -> breakdownItem(
                        entry.getKey().getDisplayLabel(),
                        entry.getValue(),
                        (entry.getValue() * 100d) / total,
                        entry.getValue() == 1
                                ? "1 visit came through this source during the selected period."
                                : entry.getValue() + " visits came through this source during the selected period."
                ))
                .toList();
    }

    private List<ProjectAnalyticsRankItemDto> buildTopCustomerItems(List<ProjectOrder> currentOrders, List<ProjectOrder> previousOrders) {
        Map<String, CustomerAggregate> current = aggregateCustomers(currentOrders);
        Map<String, CustomerAggregate> previous = aggregateCustomers(previousOrders);

        return current.values().stream()
                .sorted(Comparator.comparing(CustomerAggregate::revenue, Comparator.reverseOrder()))
                .limit(3)
                .map(aggregate -> {
                    CustomerAggregate previousAggregate = previous.get(aggregate.key());
                    return rankItem(
                            aggregate.name(),
                            aggregate.zoneLabel(),
                            formatCurrency(aggregate.revenue()),
                            aggregate.orders() + " orders · " + formatSignedPercent(percentageChange(
                                    aggregate.revenue(),
                                    previousAggregate != null ? previousAggregate.revenue() : BigDecimal.ZERO
                            ))
                    );
                })
                .toList();
    }

    private List<ProjectAnalyticsRankItemDto> buildTopProductItems(List<ProjectOrder> currentOrders, List<ProjectOrder> previousOrders) {
        Map<String, ProductAggregate> current = aggregateProducts(currentOrders);
        Map<String, ProductAggregate> previous = aggregateProducts(previousOrders);

        return current.values().stream()
                .sorted(Comparator.comparing(ProductAggregate::revenue, Comparator.reverseOrder()))
                .limit(3)
                .map(aggregate -> {
                    ProductAggregate previousAggregate = previous.get(aggregate.key());
                    return rankItem(
                            aggregate.name(),
                            aggregate.sku() != null && !aggregate.sku().isBlank() ? aggregate.sku() : "No SKU",
                            formatCurrency(aggregate.revenue()),
                            aggregate.units() + " units · " + formatSignedPercent(percentageChange(
                                    aggregate.revenue(),
                                    previousAggregate != null ? previousAggregate.revenue() : BigDecimal.ZERO
                            ))
                    );
                })
                .toList();
    }

    private List<ProjectAnalyticsRankItemDto> buildTopPageItems(List<ProjectAnalyticsEvent> pageViews) {
        Map<String, PageAggregate> aggregates = new LinkedHashMap<>();

        for (ProjectAnalyticsEvent pageView : pageViews) {
            String pagePath = Optional.ofNullable(pageView.getPagePath()).filter(value -> !value.isBlank()).orElse("/");
            String key = pagePath.toLowerCase(Locale.ROOT);
            PageAggregate current = aggregates.getOrDefault(
                    key,
                    new PageAggregate(
                            Optional.ofNullable(pageView.getPageTitle()).filter(value -> !value.isBlank()).orElse(pagePath),
                            pagePath,
                            0,
                            new LinkedHashSet<>()
                    )
            );

            Set<String> visitors = new LinkedHashSet<>(current.visitorKeys());
            visitors.add(pageView.getVisitorKey());

            aggregates.put(key, new PageAggregate(
                    current.title(),
                    current.path(),
                    current.views() + 1,
                    visitors
            ));
        }

        return aggregates.values().stream()
                .sorted(Comparator.comparing(PageAggregate::views, Comparator.reverseOrder()))
                .limit(3)
                .map(aggregate -> rankItem(
                        aggregate.title(),
                        aggregate.path(),
                        formatInteger(aggregate.views()) + " views",
                        formatInteger(aggregate.visitorKeys().size()) + " visitors"
                ))
                .toList();
    }

    private List<ProjectAnalyticsRankItemDto> buildDeviceItems(List<ProjectAnalyticsEvent> pageViews) {
        Map<ProjectAnalyticsDeviceType, Long> counts = pageViews.stream()
                .collect(Collectors.groupingBy(ProjectAnalyticsEvent::getDeviceType, LinkedHashMap::new, Collectors.counting()));

        long total = counts.values().stream().mapToLong(Long::longValue).sum();
        if (total == 0) {
            return List.of();
        }

        return counts.entrySet().stream()
                .sorted(Map.Entry.<ProjectAnalyticsDeviceType, Long>comparingByValue().reversed())
                .limit(3)
                .map(entry -> rankItem(
                        entry.getKey().getDisplayLabel(),
                        "Live traffic device split",
                        formatInteger(entry.getValue()) + " visits",
                        roundDouble((entry.getValue() * 100d) / total) + "% of traffic"
                ))
                .toList();
    }

    private List<ProjectAnalyticsInsightDto> buildEcommerceInsights(List<ProjectCustomer> currentCustomers, List<ProjectOrder> currentOrders) {
        long orders = currentOrders.size();
        BigDecimal revenue = sumRevenue(currentOrders);
        BigDecimal average = averageOrderValue(currentOrders);
        String strongestZone = buildZoneBreakdown(currentCustomers, currentOrders).stream()
                .filter(item -> item.value() > 0)
                .findFirst()
                .map(ProjectAnalyticsBreakdownItemDto::label)
                .orElse("your main selling zone");
        ProjectAnalyticsRankItemDto topProduct = buildTopProductItems(currentOrders, List.of()).stream().findFirst().orElse(null);

        List<ProjectAnalyticsInsightDto> insights = new ArrayList<>();

        insights.add(insight(
                revenue.compareTo(BigDecimal.ZERO) > 0
                        ? "Revenue is being carried by real orders"
                        : "Orders have not generated revenue yet",
                revenue.compareTo(BigDecimal.ZERO) > 0
                        ? "This period generated " + formatCurrency(revenue) + " across " + orders + " orders, which keeps the storefront performance easy to read at a glance."
                        : "Once orders start landing, this section will summarize how much revenue the storefront is actually generating."
        ));

        insights.add(insight(
                "Customer demand is strongest in " + strongestZone,
                currentCustomers.isEmpty() && currentOrders.isEmpty()
                        ? "As customer records start coming in, zone-based demand patterns will appear here."
                        : "The current range is clustering around " + strongestZone + ", which makes it your clearest zone signal right now."
        ));

        insights.add(insight(
                topProduct != null ? topProduct.title() + " is your strongest product signal" : "Average order value is your current quality signal",
                topProduct != null
                        ? "It currently leads product revenue, while the average order value sits at " + formatCurrency(average) + "."
                        : "With limited product movement so far, average order value is the clearest signal at " + formatCurrency(average) + "."
        ));

        return insights;
    }

    private List<ProjectAnalyticsInsightDto> buildPortfolioInsights(List<ProjectAnalyticsEvent> pageViews, List<ProjectAnalyticsEvent> inquiries) {
        List<ProjectAnalyticsInsightDto> insights = new ArrayList<>();
        long visitors = countDistinctVisitors(pageViews);
        long pageViewCount = pageViews.size();
        double inquiryRate = calculateRate(inquiries.size(), visitors);

        String strongestSource = buildTrafficSourceBreakdown(pageViews).stream()
                .filter(item -> item.value() > 0)
                .findFirst()
                .map(ProjectAnalyticsBreakdownItemDto::label)
                .orElse("Direct");

        ProjectAnalyticsRankItemDto topPage = buildTopPageItems(pageViews).stream().findFirst().orElse(null);

        insights.add(insight(
                visitors > 0 ? "Portfolio visits are landing with real intent" : "Traffic has not landed yet",
                visitors > 0
                        ? formatInteger(visitors) + " visitors generated " + formatInteger(pageViewCount) + " page views in this range."
                        : "Start sending traffic to the live portfolio and this page will begin surfacing audience signals."
        ));

        insights.add(insight(
                strongestSource + " is the clearest acquisition signal",
                pageViews.isEmpty()
                        ? "Source distribution appears here as soon as portfolio page views start being tracked."
                        : "The live portfolio is currently attracting the strongest visit flow from " + strongestSource.toLowerCase(Locale.ROOT) + "."
        ));

        insights.add(insight(
                topPage != null ? topPage.title() + " is holding the most attention" : "Inquiry conversion is waiting for traffic",
                topPage != null
                        ? topPage.value() + " have landed on that page, while inquiry conversion is currently " + formatPercent(inquiryRate) + "."
                        : "Once people start browsing the portfolio, this section will summarize which pages are pulling the strongest response."
        ));

        return insights;
    }

    private Map<String, CustomerAggregate> aggregateCustomers(List<ProjectOrder> orders) {
        Map<String, CustomerAggregate> aggregates = new LinkedHashMap<>();

        for (ProjectOrder order : orders) {
            String key = customerKey(order);
            CustomerAggregate current = aggregates.getOrDefault(
                    key,
                    new CustomerAggregate(
                            key,
                            customerName(order),
                            order.getCustomer() != null ? normalizeZone(order.getCustomer().getZoneLabel()) : "Unknown zone",
                            0,
                            BigDecimal.ZERO
                    )
            );

            aggregates.put(key, new CustomerAggregate(
                    current.key(),
                    current.name(),
                    current.zoneLabel(),
                    current.orders() + 1,
                    amount(current.revenue().add(amount(order.getTotal())))
            ));
        }

        return aggregates;
    }

    private Map<String, ProductAggregate> aggregateProducts(List<ProjectOrder> orders) {
        Map<String, ProductAggregate> aggregates = new LinkedHashMap<>();

        for (ProjectOrder order : orders) {
            for (ProjectOrderItem item : order.getItems()) {
                String key = itemKey(item);
                ProductAggregate current = aggregates.getOrDefault(
                        key,
                        new ProductAggregate(
                                key,
                                item.getProductName(),
                                item.getProductSku(),
                                BigDecimal.ZERO,
                                0
                        )
                );

                aggregates.put(key, new ProductAggregate(
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

    private List<ProjectOrder> loadOrders(Long projectId, ResolvedRange range) {
        return projectOrderRepository.findAllByProjectIdAndPlacedAtGreaterThanEqualAndPlacedAtLessThanOrderByPlacedAtDesc(
                projectId,
                range.startInclusive(),
                range.endExclusive()
        );
    }

    private List<ProjectAnalyticsEvent> loadEvents(Long projectId, ResolvedRange range) {
        return projectAnalyticsEventRepository.findAllByProjectIdAndOccurredAtGreaterThanEqualAndOccurredAtLessThanOrderByOccurredAtAsc(
                projectId,
                range.startInclusive(),
                range.endExclusive()
        );
    }

    private List<ProjectAnalyticsEvent> filterEventsByType(List<ProjectAnalyticsEvent> events, ProjectAnalyticsEventType type) {
        return events.stream()
                .filter(event -> event.getEventType() == type)
                .toList();
    }

    private long countDistinctVisitors(List<ProjectAnalyticsEvent> events) {
        return events.stream()
                .map(ProjectAnalyticsEvent::getVisitorKey)
                .filter(Objects::nonNull)
                .distinct()
                .count();
    }

    private List<ProjectCustomer> filterCustomersByRange(List<ProjectCustomer> customers, ResolvedRange range) {
        return customers.stream()
                .filter(customer -> customer.getCreatedAt() != null)
                .filter(customer -> !customer.getCreatedAt().isBefore(range.startInclusive()) && customer.getCreatedAt().isBefore(range.endExclusive()))
                .toList();
    }

    private BigDecimal sumRevenue(List<ProjectOrder> orders) {
        return amount(orders.stream()
                .map(ProjectOrder::getTotal)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add));
    }

    private BigDecimal averageOrderValue(List<ProjectOrder> orders) {
        if (orders.isEmpty()) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }

        return amount(sumRevenue(orders).divide(BigDecimal.valueOf(orders.size()), 2, RoundingMode.HALF_UP));
    }

    private double calculateRate(long numerator, long denominator) {
        if (denominator <= 0) {
            return 0;
        }

        return roundDouble((numerator * 100d) / denominator);
    }

    private double percentageChange(BigDecimal current, BigDecimal previous) {
        if (previous == null || previous.compareTo(BigDecimal.ZERO) == 0) {
            return current != null && current.compareTo(BigDecimal.ZERO) > 0 ? 100 : 0;
        }

        BigDecimal delta = current.subtract(previous).multiply(BigDecimal.valueOf(100)).divide(previous, 2, RoundingMode.HALF_UP);
        return roundDouble(delta.doubleValue());
    }

    private String normalizeZone(String value) {
        if (value == null || value.isBlank()) {
            return "Unknown zone";
        }

        return value.trim();
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

    private String customerKey(ProjectOrder order) {
        if (order.getCustomer() != null && order.getCustomer().getId() != null) {
            return "customer:" + order.getCustomer().getId();
        }

        return "guest:" + customerName(order).toLowerCase(Locale.ROOT);
    }

    private String itemKey(ProjectOrderItem item) {
        if (item.getProduct() != null && item.getProduct().getId() != null) {
            return "product:" + item.getProduct().getId();
        }

        return "name:" + Optional.ofNullable(item.getProductName()).orElse("unknown").trim().toLowerCase(Locale.ROOT);
    }

    private BigDecimal amount(BigDecimal value) {
        return (value == null ? BigDecimal.ZERO : value).setScale(2, RoundingMode.HALF_UP);
    }

    private double roundDouble(double value) {
        return Math.round(value * 100d) / 100d;
    }

    private String formatInteger(long value) {
        return NumberFormat.getIntegerInstance(Locale.US).format(value);
    }

    private String formatCurrency(BigDecimal value) {
        BigDecimal normalized = amount(value);
        return normalized.stripTrailingZeros().toPlainString() + " TND";
    }

    private String formatPercent(double value) {
        return roundDouble(value) + "%";
    }

    private String formatSignedPercent(double value) {
        double normalized = roundDouble(value);
        return (normalized >= 0 ? "+" : "") + normalized + "%";
    }

    private ProjectAnalyticsSummaryCardDto summaryCard(
            String key,
            String label,
            String formattedValue,
            double changePercent,
            String tone,
            String icon
    ) {
        return ProjectAnalyticsSummaryCardDto.builder()
                .key(key)
                .label(label)
                .formattedValue(formattedValue)
                .changePercent(roundDouble(changePercent))
                .tone(tone)
                .icon(icon)
                .build();
    }

    private ProjectAnalyticsMetricOptionDto metricOption(String key, String label, ProjectAnalyticsMetricFormat format) {
        return ProjectAnalyticsMetricOptionDto.builder()
                .key(key)
                .label(label)
                .format(format)
                .build();
    }

    private ProjectAnalyticsMetricValueDto metricValue(String key, double value) {
        return ProjectAnalyticsMetricValueDto.builder()
                .key(key)
                .value(roundDouble(value))
                .build();
    }

    private ProjectAnalyticsChartPointDto chartPoint(LocalDate date, ProjectAnalyticsMetricValueDto... metrics) {
        return ProjectAnalyticsChartPointDto.builder()
                .isoDate(date.toString())
                .label(CHART_LABEL_FORMATTER.format(date))
                .metrics(List.of(metrics))
                .build();
    }

    private ProjectAnalyticsSectionHeadingDto sectionHeading(String kicker, String title) {
        return ProjectAnalyticsSectionHeadingDto.builder()
                .kicker(kicker)
                .title(title)
                .build();
    }

    private ProjectAnalyticsBreakdownItemDto breakdownItem(String label, long value, double percentage, String note) {
        return ProjectAnalyticsBreakdownItemDto.builder()
                .label(label)
                .value(value)
                .percentage(roundDouble(percentage))
                .note(note)
                .build();
    }

    private ProjectAnalyticsRankItemDto rankItem(String title, String subtitle, String value, String meta) {
        return ProjectAnalyticsRankItemDto.builder()
                .title(title)
                .subtitle(subtitle)
                .value(value)
                .meta(meta)
                .build();
    }

    private ProjectAnalyticsInsightDto insight(String title, String body) {
        return ProjectAnalyticsInsightDto.builder()
                .title(title)
                .body(body)
                .build();
    }

    private Project getOwnedProject(String email, Long projectId) {
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        return projectRepository.findByIdAndUserId(projectId, user.getId()).orElseThrow(() -> new RuntimeException("Project not found"));
    }

    private ResolvedRange resolveRange(AnalyticsRangePreset rangePreset) {
        LocalDate today = LocalDate.now();
        return switch (rangePreset) {
            case LAST_7_DAYS -> new ResolvedRange(today.minusDays(6).atStartOfDay(), today.plusDays(1).atStartOfDay());
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

    private record CustomerAggregate(String key, String name, String zoneLabel, long orders, BigDecimal revenue) {
    }

    private record ProductAggregate(String key, String name, String sku, BigDecimal revenue, int units) {
    }

    private record PageAggregate(String title, String path, long views, Set<String> visitorKeys) {
    }
}
