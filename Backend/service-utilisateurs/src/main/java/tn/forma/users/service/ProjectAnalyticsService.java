package tn.forma.users.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.forma.users.dto.*;
import tn.forma.users.model.Project;
import tn.forma.users.model.ProjectCustomer;
import tn.forma.users.model.ProjectOrder;
import tn.forma.users.model.ProjectOrderItem;
import tn.forma.users.model.User;
import tn.forma.users.repository.ProjectCustomerRepository;
import tn.forma.users.repository.ProjectOrderRepository;
import tn.forma.users.repository.ProjectRepository;
import tn.forma.users.repository.UserRepository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProjectAnalyticsService {

    private static final DateTimeFormatter CHART_LABEL_FORMATTER = DateTimeFormatter.ofPattern("MMM dd", Locale.ENGLISH);

    private final ProjectRepository projectRepository;
    private final ProjectOrderRepository projectOrderRepository;
    private final ProjectCustomerRepository projectCustomerRepository;
    private final UserRepository userRepository;

    public ProjectAnalyticsPageDto getAnalyticsPage(String email, Long projectId, AnalyticsRangePreset rangePreset) {
        Project project = getOwnedProject(email, projectId);
        ResolvedRange currentRange = resolveRange(rangePreset);
        ResolvedRange previousRange = currentRange.previous();

        List<ProjectOrder> currentOrders = loadOrders(project.getId(), currentRange);
        List<ProjectOrder> previousOrders = loadOrders(project.getId(), previousRange);

        List<ProjectCustomer> allCustomers = projectCustomerRepository.findAllByProjectIdOrderByCreatedAtDesc(project.getId());
        List<ProjectCustomer> currentCustomers = filterCustomersByRange(allCustomers, currentRange);
        List<ProjectCustomer> previousCustomers = filterCustomersByRange(allCustomers, previousRange);

        return ProjectAnalyticsPageDto.builder()
                .rangePreset(rangePreset)
                .rangeStart(Objects.toString(currentRange.startInclusive(), null))
                .rangeEndExclusive(Objects.toString(currentRange.endExclusive(), null))
                .summary(buildSummary(currentCustomers, previousCustomers, currentOrders, previousOrders))
                .chartPoints(buildChartPoints(currentCustomers, currentOrders, currentRange))
                .zoneBreakdown(buildZoneBreakdown(currentCustomers, currentOrders))
                .topCustomers(buildTopCustomers(currentOrders, previousOrders))
                .topProducts(buildTopProducts(currentOrders, previousOrders))
                .insights(buildInsights(currentCustomers, currentOrders))
                .hasData(!currentOrders.isEmpty() || !currentCustomers.isEmpty())
                .build();
    }

    private ProjectAnalyticsSummaryDto buildSummary(
            List<ProjectCustomer> currentCustomers,
            List<ProjectCustomer> previousCustomers,
            List<ProjectOrder> currentOrders,
            List<ProjectOrder> previousOrders
    ) {
        BigDecimal currentRevenue = sumRevenue(currentOrders);
        BigDecimal previousRevenue = sumRevenue(previousOrders);
        BigDecimal currentAverage = averageOrderValue(currentOrders);
        BigDecimal previousAverage = averageOrderValue(previousOrders);

        return ProjectAnalyticsSummaryDto.builder()
                .customers(currentCustomers.size())
                .customersChangePercent(percentageChange(BigDecimal.valueOf(currentCustomers.size()), BigDecimal.valueOf(previousCustomers.size())))
                .orders(currentOrders.size())
                .ordersChangePercent(percentageChange(BigDecimal.valueOf(currentOrders.size()), BigDecimal.valueOf(previousOrders.size())))
                .revenue(currentRevenue)
                .revenueChangePercent(percentageChange(currentRevenue, previousRevenue))
                .averageOrderValue(currentAverage)
                .averageOrderValueChangePercent(percentageChange(currentAverage, previousAverage))
                .build();
    }

    private List<ProjectAnalyticsChartPointDto> buildChartPoints(
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
            points.add(ProjectAnalyticsChartPointDto.builder()
                    .isoDate(cursor.toString())
                    .label(CHART_LABEL_FORMATTER.format(cursor))
                    .customers(customersByDay.getOrDefault(cursor, 0L))
                    .orders(ordersForDate.size())
                    .revenue(sumRevenue(ordersForDate))
                    .build());
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
                .map(entry -> ProjectAnalyticsBreakdownItemDto.builder()
                        .label(entry.getKey())
                        .value(entry.getValue())
                        .percentage(roundDouble((entry.getValue() * 100d) / total))
                        .note(entry.getValue() == 1
                                ? "1 customer recorded in this zone during the selected period."
                                : entry.getValue() + " customers recorded in this zone during the selected period.")
                        .build())
                .toList();
    }

    private List<ProjectAnalyticsTopCustomerDto> buildTopCustomers(List<ProjectOrder> currentOrders, List<ProjectOrder> previousOrders) {
        Map<String, CustomerAggregate> current = aggregateCustomers(currentOrders);
        Map<String, CustomerAggregate> previous = aggregateCustomers(previousOrders);

        return current.values().stream()
                .sorted(Comparator.comparing(CustomerAggregate::revenue, Comparator.reverseOrder()))
                .limit(3)
                .map(aggregate -> {
                    CustomerAggregate previousAggregate = previous.get(aggregate.key());
                    return ProjectAnalyticsTopCustomerDto.builder()
                            .customerId(aggregate.customerId())
                            .name(aggregate.name())
                            .zoneLabel(aggregate.zoneLabel())
                            .orders(aggregate.orders())
                            .revenue(aggregate.revenue())
                            .growthPercent(percentageChange(
                                    aggregate.revenue(),
                                    previousAggregate != null ? previousAggregate.revenue() : BigDecimal.ZERO
                            ))
                            .build();
                })
                .toList();
    }

    private List<ProjectSalesTopProductDto> buildTopProducts(List<ProjectOrder> currentOrders, List<ProjectOrder> previousOrders) {
        Map<String, ProductAggregate> current = aggregateProducts(currentOrders);
        Map<String, ProductAggregate> previous = aggregateProducts(previousOrders);

        return current.values().stream()
                .sorted(Comparator.comparing(ProductAggregate::revenue, Comparator.reverseOrder()))
                .limit(3)
                .map(aggregate -> {
                    ProductAggregate previousAggregate = previous.get(aggregate.key());
                    return ProjectSalesTopProductDto.builder()
                            .productId(aggregate.productId())
                            .name(aggregate.name())
                            .sku(aggregate.sku())
                            .revenue(aggregate.revenue())
                            .units(aggregate.units())
                            .growthPercent(percentageChange(
                                    aggregate.revenue(),
                                    previousAggregate != null ? previousAggregate.revenue() : BigDecimal.ZERO
                            ))
                            .build();
                })
                .toList();
    }

    private List<ProjectAnalyticsInsightDto> buildInsights(List<ProjectCustomer> currentCustomers, List<ProjectOrder> currentOrders) {
        long orders = currentOrders.size();
        BigDecimal revenue = sumRevenue(currentOrders);
        BigDecimal average = averageOrderValue(currentOrders);
        String strongestZone = buildZoneBreakdown(currentCustomers, currentOrders).stream()
                .filter(item -> item.value() > 0)
                .findFirst()
                .map(ProjectAnalyticsBreakdownItemDto::label)
                .orElse("your main selling zone");
        ProjectSalesTopProductDto topProduct = buildTopProducts(currentOrders, List.of()).stream().findFirst().orElse(null);

        List<ProjectAnalyticsInsightDto> insights = new ArrayList<>();

        insights.add(ProjectAnalyticsInsightDto.builder()
                .title(revenue.compareTo(BigDecimal.ZERO) > 0
                        ? "Revenue is being carried by real orders"
                        : "Orders have not generated revenue yet")
                .body(revenue.compareTo(BigDecimal.ZERO) > 0
                        ? "This period generated " + amount(revenue).toPlainString() + " TND across " + orders + " orders, which keeps the storefront performance easy to read at a glance."
                        : "Once orders start landing, this section will summarize how much revenue the storefront is actually generating.")
                .build());

        insights.add(ProjectAnalyticsInsightDto.builder()
                .title("Customer demand is strongest in " + strongestZone)
                .body(currentCustomers.isEmpty() && currentOrders.isEmpty()
                        ? "As customer records start coming in, zone-based demand patterns will appear here."
                        : "The current range is clustering around " + strongestZone + ", which makes it your clearest zone signal right now.")
                .build());

        insights.add(ProjectAnalyticsInsightDto.builder()
                .title(topProduct != null ? topProduct.getName() + " is your strongest product signal" : "Average order value is your current quality signal")
                .body(topProduct != null
                        ? "It currently leads product revenue, while the average order value sits at " + amount(average).toPlainString() + " TND."
                        : "With limited product movement so far, average order value is the clearest signal at " + amount(average).toPlainString() + " TND.")
                .build());

        return insights;
    }

    private Map<String, CustomerAggregate> aggregateCustomers(List<ProjectOrder> orders) {
        Map<String, CustomerAggregate> aggregates = new LinkedHashMap<>();

        for (ProjectOrder order : orders) {
            String key = customerKey(order);
            CustomerAggregate current = aggregates.getOrDefault(
                    key,
                    new CustomerAggregate(
                            order.getCustomer() != null ? order.getCustomer().getId() : null,
                            key,
                            customerName(order),
                            order.getCustomer() != null ? normalizeZone(order.getCustomer().getZoneLabel()) : "Unknown zone",
                            0,
                            BigDecimal.ZERO
                    )
            );

            aggregates.put(key, new CustomerAggregate(
                    current.customerId(),
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
                                item.getProduct() != null ? item.getProduct().getId() : null,
                                key,
                                item.getProductName(),
                                item.getProductSku(),
                                BigDecimal.ZERO,
                                0
                        )
                );

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

    private List<ProjectOrder> loadOrders(Long projectId, ResolvedRange range) {
        return projectOrderRepository.findAllByProjectIdAndPlacedAtGreaterThanEqualAndPlacedAtLessThanOrderByPlacedAtDesc(
                projectId,
                range.startInclusive(),
                range.endExclusive()
        );
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

    private record CustomerAggregate(Long customerId, String key, String name, String zoneLabel, long orders, BigDecimal revenue) {
    }

    private record ProductAggregate(Long productId, String key, String name, String sku, BigDecimal revenue, int units) {
    }
}
