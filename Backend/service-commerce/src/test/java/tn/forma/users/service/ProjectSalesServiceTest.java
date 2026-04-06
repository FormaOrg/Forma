package tn.forma.users.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import tn.forma.users.dto.ProjectSalesPageDto;
import tn.forma.users.dto.SalesOrderFilter;
import tn.forma.users.dto.SalesOrderSort;
import tn.forma.users.dto.SalesRangePreset;
import tn.forma.users.model.*;
import tn.forma.users.repository.ProjectOrderRepository;
import tn.forma.users.repository.ProjectRepository;
import tn.forma.users.repository.UserRepository;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProjectSalesServiceTest {

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private ProjectOrderRepository projectOrderRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ProjectSalesService projectSalesService;

    @Test
    void getSalesPageBuildsAggregatedSalesDataFromOrders() {
        User user = buildUser();
        Project project = buildProject(user);
        ProjectProduct oliveOil = buildProduct(project, 100L, "Olive Oil", "OO-1");
        ProjectProduct datesBox = buildProduct(project, 101L, "Dates Box", "DB-1");
        ProjectCustomer customer = buildCustomer(project, 300L, "Skander", "Boughnimni", "Centre");

        ProjectOrder deliveredOrder = buildOrder(
                10L,
                project,
                customer,
                "#10001",
                LocalDateTime.now().minusDays(3),
                LocalDateTime.now().minusDays(1),
                OrderPaymentStatus.COLLECTED,
                OrderFulfillmentStatus.DELIVERED,
                "45.00",
                buildItem(oliveOil, "Olive Oil", "OO-1", 2, "20.00", "40.00"),
                buildItem(datesBox, "Dates Box", "DB-1", 1, "5.00", "5.00")
        );

        ProjectOrder scheduledOrder = buildOrder(
                11L,
                project,
                customer,
                "#10002",
                LocalDateTime.now().minusDays(1),
                null,
                OrderPaymentStatus.DUE_ON_DELIVERY,
                OrderFulfillmentStatus.SCHEDULED,
                "30.00",
                buildItem(oliveOil, "Olive Oil", "OO-1", 1, "30.00", "30.00")
        );

        ProjectOrder comparisonOrder = buildOrder(
                12L,
                project,
                customer,
                "#09001",
                LocalDateTime.now().minusDays(33),
                LocalDateTime.now().minusDays(32),
                OrderPaymentStatus.COLLECTED,
                OrderFulfillmentStatus.DELIVERED,
                "25.00",
                buildItem(datesBox, "Dates Box", "DB-1", 5, "5.00", "25.00")
        );

        when(userRepository.findByEmail("owner@forma.test")).thenReturn(Optional.of(user));
        when(projectRepository.findByIdAndUserId(project.getId(), user.getId())).thenReturn(Optional.of(project));
        when(projectOrderRepository.findAllByProjectIdAndPlacedAtGreaterThanEqualAndPlacedAtLessThanOrderByPlacedAtDesc(
                eq(project.getId()),
                any(LocalDateTime.class),
                any(LocalDateTime.class)
        )).thenReturn(List.of(scheduledOrder, deliveredOrder), List.of(comparisonOrder));

        ProjectSalesPageDto response = projectSalesService.getSalesPage(
                "owner@forma.test",
                project.getId(),
                SalesRangePreset.LAST_30_DAYS,
                true,
                "",
                SalesOrderSort.PLACED_AT_DESC,
                SalesOrderFilter.ALL,
                0,
                5
        );

        assertThat(response.isHasData()).isTrue();
        assertThat(response.getSummary().getRevenue()).isEqualByComparingTo("75.00");
        assertThat(response.getSummary().getOrders()).isEqualTo(2);
        assertThat(response.getSummary().getAverageOrderValue()).isEqualByComparingTo("37.50");
        assertThat(response.getSummary().getAwaitingDelivery()).isEqualTo(1);
        assertThat(response.getSummary().getDelivered()).isEqualTo(1);
        assertThat(response.getSummary().getRevenueChangePercent()).isEqualTo(200.0);
        assertThat(response.getTopProducts()).hasSize(2);
        assertThat(response.getTopProducts().get(0).getName()).isEqualTo("Olive Oil");
        assertThat(response.getTopProducts().get(0).getRevenue()).isEqualByComparingTo("70.00");
        assertThat(response.getOrders().getItems()).hasSize(2);
        assertThat(response.getOrders().getItems().get(0).getOrderNumber()).isEqualTo("#10002");
        assertThat(response.getDeliveryStats()).hasSize(4);
        assertThat(response.getChartPoints()).isNotEmpty();
    }

    @Test
    void exportOrdersCsvAppliesSearchAndStatusFilters() {
        User user = buildUser();
        Project project = buildProject(user);
        ProjectProduct oliveOil = buildProduct(project, 100L, "Olive Oil", "OO-1");
        ProjectCustomer customer = buildCustomer(project, 300L, "Skander", "Boughnimni", "Centre");

        ProjectOrder matchingOrder = buildOrder(
                21L,
                project,
                customer,
                "#20001",
                LocalDateTime.now().minusDays(2),
                null,
                OrderPaymentStatus.DUE_ON_DELIVERY,
                OrderFulfillmentStatus.SCHEDULED,
                "18.00",
                buildItem(oliveOil, "Olive Oil", "OO-1", 1, "18.00", "18.00")
        );

        ProjectOrder ignoredOrder = buildOrder(
                22L,
                project,
                buildCustomer(project, 301L, "Amira", "Ben Ali", "North"),
                "#20002",
                LocalDateTime.now().minusDays(1),
                null,
                OrderPaymentStatus.COLLECTED,
                OrderFulfillmentStatus.DELIVERED,
                "24.00",
                buildItem(oliveOil, "Olive Oil", "OO-1", 1, "24.00", "24.00")
        );

        when(userRepository.findByEmail("owner@forma.test")).thenReturn(Optional.of(user));
        when(projectRepository.findByIdAndUserId(project.getId(), user.getId())).thenReturn(Optional.of(project));
        when(projectOrderRepository.findAllByProjectIdAndPlacedAtGreaterThanEqualAndPlacedAtLessThanOrderByPlacedAtDesc(
                eq(project.getId()),
                any(LocalDateTime.class),
                any(LocalDateTime.class)
        )).thenReturn(List.of(ignoredOrder, matchingOrder));

        byte[] csv = projectSalesService.exportOrdersCsv(
                "owner@forma.test",
                project.getId(),
                SalesRangePreset.LAST_30_DAYS,
                "Skander",
                SalesOrderSort.PLACED_AT_DESC,
                SalesOrderFilter.DUE_ON_DELIVERY
        );

        String text = new String(csv, StandardCharsets.UTF_8);

        assertThat(text).contains("order_number,placed_at,customer,payment_status,fulfillment_status,total,currency");
        assertThat(text).contains("\"#20001\"");
        assertThat(text).contains("\"Skander Boughnimni\"");
        assertThat(text).doesNotContain("\"#20002\"");
    }

    private User buildUser() {
        return User.builder()
                .id(7L)
                .firstName("Store")
                .lastName("Owner")
                .email("owner@forma.test")
                .password("secret")
                .build();
    }

    private Project buildProject(User user) {
        return Project.builder()
                .id(11L)
                .user(user)
                .name("Forma Store")
                .type(ProjectType.ECOMMERCE)
                .creationMethod(CreationMethod.AI_PROMPT)
                .status(ProjectStatus.DRAFT)
                .build();
    }

    private ProjectCustomer buildCustomer(Project project, Long id, String firstName, String lastName, String zone) {
        return ProjectCustomer.builder()
                .id(id)
                .project(project)
                .firstName(firstName)
                .lastName(lastName)
                .zoneLabel(zone)
                .build();
    }

    private ProjectProduct buildProduct(Project project, Long id, String name, String sku) {
        return ProjectProduct.builder()
                .id(id)
                .project(project)
                .name(name)
                .sku(sku)
                .category("Featured")
                .price(new BigDecimal("10.00"))
                .build();
    }

    private ProjectOrder buildOrder(
            Long id,
            Project project,
            ProjectCustomer customer,
            String orderNumber,
            LocalDateTime placedAt,
            LocalDateTime deliveredAt,
            OrderPaymentStatus paymentStatus,
            OrderFulfillmentStatus fulfillmentStatus,
            String total,
            ProjectOrderItem... items
    ) {
        ProjectOrder order = ProjectOrder.builder()
                .id(id)
                .project(project)
                .customer(customer)
                .orderNumber(orderNumber)
                .placedAt(placedAt)
                .deliveredAt(deliveredAt)
                .paymentStatus(paymentStatus)
                .fulfillmentStatus(fulfillmentStatus)
                .subtotal(new BigDecimal(total))
                .deliveryFee(BigDecimal.ZERO)
                .total(new BigDecimal(total))
                .items(List.of(items))
                .build();

        for (ProjectOrderItem item : items) {
            item.setOrder(order);
        }

        return order;
    }

    private ProjectOrderItem buildItem(
            ProjectProduct product,
            String name,
            String sku,
            int quantity,
            String unitPrice,
            String lineTotal
    ) {
        return ProjectOrderItem.builder()
                .product(product)
                .productName(name)
                .productSku(sku)
                .quantity(quantity)
                .unitPrice(new BigDecimal(unitPrice))
                .lineTotal(new BigDecimal(lineTotal))
                .build();
    }
}
