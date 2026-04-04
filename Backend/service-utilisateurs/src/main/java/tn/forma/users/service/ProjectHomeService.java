package tn.forma.users.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.forma.users.dto.ProjectHomeActionDto;
import tn.forma.users.dto.ProjectHomeActivityDto;
import tn.forma.users.dto.ProjectHomeMetricDto;
import tn.forma.users.dto.ProjectHomePageDto;
import tn.forma.users.model.Project;
import tn.forma.users.model.ProjectCustomer;
import tn.forma.users.model.ProjectOrder;
import tn.forma.users.model.ProjectProduct;
import tn.forma.users.model.User;
import tn.forma.users.repository.ProjectCustomerRepository;
import tn.forma.users.repository.ProjectOrderRepository;
import tn.forma.users.repository.ProjectProductRepository;
import tn.forma.users.repository.ProjectRepository;
import tn.forma.users.repository.UserRepository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProjectHomeService {

    private final ProjectRepository projectRepository;
    private final ProjectOrderRepository projectOrderRepository;
    private final ProjectProductRepository projectProductRepository;
    private final ProjectCustomerRepository projectCustomerRepository;
    private final UserRepository userRepository;

    public ProjectHomePageDto getHomePage(String email, Long projectId) {
        Project project = getOwnedProject(email, projectId);
        List<ProjectProduct> products = projectProductRepository.findAllByProjectIdOrderByUpdatedAtDesc(project.getId());
        List<ProjectCustomer> customers = projectCustomerRepository.findAllByProjectIdOrderByCreatedAtDesc(project.getId());
        List<ProjectOrder> orders = projectOrderRepository.findAllByProjectIdOrderByPlacedAtDesc(project.getId());

        return ProjectHomePageDto.builder()
                .projectId(project.getId())
                .projectName(project.getName())
                .ownerName(displayName(project.getUser()))
                .projectStatus(project.getStatus().name())
                .published(project.isPublished())
                .projectType(project.getType().name())
                .creationMethod(project.getCreationMethod().name())
                .metrics(buildMetrics(project, products, customers, orders))
                .recentActivities(buildActivities(project, products, customers, orders))
                .suggestedActions(buildActions(project, products, customers, orders))
                .build();
    }

    private List<ProjectHomeMetricDto> buildMetrics(
            Project project,
            List<ProjectProduct> products,
            List<ProjectCustomer> customers,
            List<ProjectOrder> orders
    ) {
        BigDecimal revenue = orders.stream()
                .map(ProjectOrder::getTotal)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        long activeProducts = products.stream().filter(ProjectProduct::isActive).count();
        long awaitingDelivery = orders.stream().filter(order -> order.getDeliveredAt() == null).count();

        return List.of(
                ProjectHomeMetricDto.builder()
                        .label("Products")
                        .value(String.valueOf(products.size()))
                        .helper(activeProducts + " active in the catalog")
                        .build(),
                ProjectHomeMetricDto.builder()
                        .label("Customers")
                        .value(String.valueOf(customers.size()))
                        .helper(customers.isEmpty() ? "No customers yet" : "Saved from real orders")
                        .build(),
                ProjectHomeMetricDto.builder()
                        .label("Orders")
                        .value(String.valueOf(orders.size()))
                        .helper(awaitingDelivery + " awaiting delivery")
                        .build(),
                ProjectHomeMetricDto.builder()
                        .label("Revenue")
                        .value(amount(revenue).toPlainString() + " TND")
                        .helper(project.isPublished() ? "Captured from persisted orders" : "Ready when the site goes live")
                        .build()
        );
    }

    private List<ProjectHomeActivityDto> buildActivities(
            Project project,
            List<ProjectProduct> products,
            List<ProjectCustomer> customers,
            List<ProjectOrder> orders
    ) {
        List<ActivityEvent> events = new ArrayList<>();
        events.add(new ActivityEvent(
                project.getUpdatedAt() != null ? project.getUpdatedAt() : project.getCreatedAt(),
                "Project updated",
                project.isPublished()
                        ? "Your storefront settings were updated on the live project."
                        : "Your workspace draft was updated and saved.",
                "/app/projects/" + project.getId() + "/home"
        ));

        products.stream().limit(4).forEach(product -> events.add(new ActivityEvent(
                product.getUpdatedAt() != null ? product.getUpdatedAt() : product.getCreatedAt(),
                "Catalog item updated",
                product.getName() + " is saved in the catalog.",
                "/app/projects/" + project.getId() + "/catalog"
        )));

        customers.stream().limit(4).forEach(customer -> events.add(new ActivityEvent(
                customer.getCreatedAt(),
                "Customer added",
                customer.getFirstName() + " " + customer.getLastName() + " is now in your customer list.",
                "/app/projects/" + project.getId() + "/customers"
        )));

        orders.stream().limit(4).forEach(order -> events.add(new ActivityEvent(
                order.getDeliveredAt() != null ? order.getDeliveredAt() : order.getPlacedAt(),
                order.getDeliveredAt() != null ? "Order delivered" : "Order placed",
                order.getOrderNumber() + " is linked to your sales pipeline.",
                "/app/projects/" + project.getId() + "/sales"
        )));

        return events.stream()
                .filter(event -> event.occurredAt() != null)
                .sorted(Comparator.comparing(ActivityEvent::occurredAt, Comparator.reverseOrder()))
                .limit(6)
                .map(event -> ProjectHomeActivityDto.builder()
                        .title(event.title())
                        .description(event.description())
                        .occurredAt(Objects.toString(event.occurredAt(), null))
                        .route(event.route())
                        .build())
                .toList();
    }

    private List<ProjectHomeActionDto> buildActions(
            Project project,
            List<ProjectProduct> products,
            List<ProjectCustomer> customers,
            List<ProjectOrder> orders
    ) {
        List<ProjectHomeActionDto> actions = new ArrayList<>();

        if (!project.isPublished()) {
            actions.add(ProjectHomeActionDto.builder()
                    .title("Publish your storefront")
                    .description("Move the project out of draft once your main pages and business details are ready.")
                    .route("/app/projects/" + project.getId())
                    .actionLabel("Open setup")
                    .build());
        }
        if (products.isEmpty()) {
            actions.add(ProjectHomeActionDto.builder()
                    .title("Add your first product")
                    .description("Populate the real catalog so orders and sales analytics have source data.")
                    .route("/app/projects/" + project.getId() + "/catalog")
                    .actionLabel("Open catalog")
                    .build());
        }
        if (customers.isEmpty()) {
            actions.add(ProjectHomeActionDto.builder()
                    .title("Start building your customer list")
                    .description("Customers created from real orders will appear automatically, and you can manage them from the workspace.")
                    .route("/app/projects/" + project.getId() + "/customers")
                    .actionLabel("View customers")
                    .build());
        }
        if (orders.isEmpty()) {
            actions.add(ProjectHomeActionDto.builder()
                    .title("Track the first order")
                    .description("As soon as orders are persisted for this project, sales metrics and customer totals will become fully active.")
                    .route("/app/projects/" + project.getId() + "/sales")
                    .actionLabel("Open sales")
                    .build());
        }
        if (actions.isEmpty()) {
            actions.add(ProjectHomeActionDto.builder()
                    .title("Keep your storefront fresh")
                    .description("Review catalog, customers, and orders regularly to keep the project ready for the next launch push.")
                    .route("/app/projects/" + project.getId() + "/catalog")
                    .actionLabel("Review catalog")
                    .build());
        }

        return actions.stream().limit(3).toList();
    }

    private Project getOwnedProject(String email, Long projectId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return projectRepository.findByIdAndUserId(projectId, user.getId())
                .orElseThrow(() -> new RuntimeException("Project not found"));
    }

    private String displayName(User user) {
        String firstName = user.getFirstName() != null ? user.getFirstName().trim() : "";
        String lastName = user.getLastName() != null ? user.getLastName().trim() : "";
        String fullName = (firstName + " " + lastName).trim();
        return fullName.isEmpty() ? user.getUsername() : fullName;
    }

    private BigDecimal amount(BigDecimal value) {
        return (value == null ? BigDecimal.ZERO : value).setScale(2, RoundingMode.HALF_UP);
    }

    private record ActivityEvent(LocalDateTime occurredAt, String title, String description, String route) {
    }
}
