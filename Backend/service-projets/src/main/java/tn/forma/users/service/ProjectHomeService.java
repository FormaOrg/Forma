package tn.forma.users.service;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import tn.forma.users.dto.ProjectHomeActionDto;
import tn.forma.users.dto.ProjectHomeActivityDto;
import tn.forma.users.dto.ProjectHomeMetricDto;
import tn.forma.users.dto.ProjectHomePageDto;
import tn.forma.users.model.CollaboratorStatus;
import tn.forma.users.model.PortfolioPage;
import tn.forma.users.model.ProjectAnalyticsEvent;
import tn.forma.users.model.ProjectAnalyticsEventType;
import tn.forma.users.model.Project;
import tn.forma.users.model.ProjectCustomer;
import tn.forma.users.model.ProjectOrder;
import tn.forma.users.model.ProjectProduct;
import tn.forma.users.model.ProjectType;
import tn.forma.users.model.User;
import tn.forma.users.repository.ProjectAnalyticsEventRepository;
import tn.forma.users.repository.ProjectCollaboratorRepository;
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
    private final PortfolioPageService portfolioPageService;
    private final ProjectAnalyticsEventRepository projectAnalyticsEventRepository;
    private final UserRepository userRepository;
    private final ProjectCollaboratorRepository collaboratorRepository;

    public ProjectHomePageDto getHomePage(String email, Long projectId) {
        Project project = getAccessibleProject(email, projectId);
        List<ProjectProduct> products = projectProductRepository.findAllByProjectIdOrderByUpdatedAtDesc(project.getId());
        List<ProjectCustomer> customers = projectCustomerRepository.findAllByProjectIdOrderByCreatedAtDesc(project.getId());
        List<ProjectOrder> orders = projectOrderRepository.findAllByProjectIdOrderByPlacedAtDesc(project.getId());
        List<PortfolioPage> portfolioPages = project.getType() == ProjectType.PORTFOLIO
                ? portfolioPageService.ensureDefaultPages(project)
                : List.of();
        List<ProjectAnalyticsEvent> portfolioInquiryEvents = project.getType() == ProjectType.PORTFOLIO
                ? projectAnalyticsEventRepository.findAllByProjectIdAndOccurredAtGreaterThanEqualAndOccurredAtLessThanOrderByOccurredAtAsc(
                        project.getId(),
                        LocalDateTime.now().minusYears(5),
                        LocalDateTime.now().plusDays(1)
                ).stream().filter(event -> event.getEventType() == ProjectAnalyticsEventType.INQUIRY_SUBMITTED).toList()
                : List.of();

        return ProjectHomePageDto.builder()
                .projectId(project.getId())
                .projectName(project.getName())
                .ownerName(displayName(project.getUser()))
                .projectStatus(project.getStatus() != null ? project.getStatus().name() : "DRAFT")
                .published(project.isPublished())
                .projectType(project.getType() != null ? project.getType().name() : ProjectType.BUSINESS.name())
                .creationMethod(project.getCreationMethod() != null ? project.getCreationMethod().name() : "")
                .metrics(buildMetrics(project, products, customers, orders, portfolioPages, portfolioInquiryEvents))
                .recentActivities(buildActivities(project, products, customers, orders, portfolioPages, portfolioInquiryEvents))
                .suggestedActions(buildActions(project, products, customers, orders, portfolioPages, portfolioInquiryEvents))
                .build();
    }

    private List<ProjectHomeMetricDto> buildMetrics(
            Project project,
            List<ProjectProduct> products,
            List<ProjectCustomer> customers,
            List<ProjectOrder> orders,
            List<PortfolioPage> portfolioPages,
            List<ProjectAnalyticsEvent> portfolioInquiryEvents
    ) {
        if (project.getType() == ProjectType.PORTFOLIO) {
            long publishedPages = portfolioPages.stream().filter(page -> page.getStatus() == tn.forma.users.model.PortfolioPageStatus.PUBLISHED).count();
            return List.of(
                    ProjectHomeMetricDto.builder()
                            .label("Pages")
                            .value(String.valueOf(portfolioPages.size()))
                            .helper(publishedPages + " published in the portfolio")
                            .build(),
                    ProjectHomeMetricDto.builder()
                            .label("Inquiries")
                            .value(String.valueOf(portfolioInquiryEvents.size()))
                            .helper(portfolioInquiryEvents.isEmpty() ? "No inquiry events yet" : "Tracked from live portfolio activity")
                            .build(),
                    ProjectHomeMetricDto.builder()
                            .label("Published")
                            .value(String.valueOf(publishedPages))
                            .helper("Pages currently ready for visitors")
                            .build(),
                    ProjectHomeMetricDto.builder()
                            .label("Launch state")
                            .value(project.getStatus() == null ? "Draft" : formatStatus(project.getStatus().name()))
                            .helper(project.isPublished() ? "Live portfolio is visible to visitors" : "Still private while you refine the portfolio")
                            .build()
            );
        }

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
            List<ProjectOrder> orders,
            List<PortfolioPage> portfolioPages,
            List<ProjectAnalyticsEvent> portfolioInquiryEvents
    ) {
        if (project.getType() == ProjectType.PORTFOLIO) {
            return buildPortfolioActivities(project, portfolioPages, portfolioInquiryEvents);
        }

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
            List<ProjectOrder> orders,
            List<PortfolioPage> portfolioPages,
            List<ProjectAnalyticsEvent> portfolioInquiryEvents
    ) {
        if (project.getType() == ProjectType.PORTFOLIO) {
            return buildPortfolioActions(project, portfolioPages, portfolioInquiryEvents);
        }

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

    private List<ProjectHomeActivityDto> buildPortfolioActivities(
            Project project,
            List<PortfolioPage> pages,
            List<ProjectAnalyticsEvent> inquiryEvents
    ) {
        List<ActivityEvent> events = new ArrayList<>();
        events.add(new ActivityEvent(
                project.getUpdatedAt() != null ? project.getUpdatedAt() : project.getCreatedAt(),
                "Project updated",
                project.isPublished()
                        ? "Your live portfolio settings were updated."
                        : "Your portfolio draft was updated and saved.",
                "/app/projects/" + project.getId() + "/home"
        ));

        pages.forEach(page -> events.add(new ActivityEvent(
                page.getUpdatedAt() != null ? page.getUpdatedAt() : page.getCreatedAt(),
                page.isFeatured() ? "Homepage updated" : page.getTitle() + " page reviewed",
                page.getDescription(),
                "/app/projects/" + project.getId() + "/pages"
        )));

        inquiryEvents.stream()
                .sorted(Comparator.comparing(ProjectAnalyticsEvent::getOccurredAt, Comparator.reverseOrder()))
                .limit(3)
                .forEach(event -> events.add(new ActivityEvent(
                        event.getOccurredAt(),
                        "Inquiry captured",
                        buildInquiryDescription(event),
                        "/app/projects/" + project.getId() + "/audience"
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

    private List<ProjectHomeActionDto> buildPortfolioActions(
            Project project,
            List<PortfolioPage> pages,
            List<ProjectAnalyticsEvent> inquiryEvents
    ) {
        List<ProjectHomeActionDto> actions = new ArrayList<>();
        long publishedPages = pages.stream().filter(page -> page.getStatus() == tn.forma.users.model.PortfolioPageStatus.PUBLISHED).count();
        boolean hasDraftPages = pages.stream().anyMatch(page -> page.getStatus() == tn.forma.users.model.PortfolioPageStatus.DRAFT);

        if (!project.isPublished()) {
            actions.add(ProjectHomeActionDto.builder()
                    .title("Publish your portfolio")
                    .description("Move the project out of draft once your core pages and inquiry flow are ready.")
                    .route("/app/projects/" + project.getId())
                    .actionLabel("Open setup")
                    .build());
        }
        if (hasDraftPages || publishedPages < pages.size()) {
            actions.add(ProjectHomeActionDto.builder()
                    .title("Refine homepage and case studies")
                    .description("Tighten the page structure, featured work, and supporting copy before you share the portfolio.")
                    .route("/app/projects/" + project.getId() + "/pages")
                    .actionLabel("Review pages")
                    .build());
        }
        if (inquiryEvents.isEmpty()) {
            actions.add(ProjectHomeActionDto.builder()
                    .title("Tighten the contact flow")
                    .description("Make sure your contact page and inquiry path are clear before traffic starts landing.")
                    .route("/app/projects/" + project.getId() + "/audience")
                    .actionLabel("View inquiries")
                    .build());
        }
        if (actions.isEmpty()) {
            actions.add(ProjectHomeActionDto.builder()
                    .title("Check portfolio analytics")
                    .description("Review how visitors move across your pages and where inquiries are starting to land.")
                    .route("/app/projects/" + project.getId() + "/analytics")
                    .actionLabel("Open analytics")
                    .build());
        }

        return actions.stream().limit(3).toList();
    }

    private String buildInquiryDescription(ProjectAnalyticsEvent event) {
        String pageTitle = event.getPageTitle() != null && !event.getPageTitle().isBlank() ? event.getPageTitle() : "your portfolio";
        String source = event.getSourceType() != null ? formatStatus(event.getSourceType().name()) : "Direct";
        return "A new inquiry was captured from " + pageTitle + " via " + source.toLowerCase() + " traffic.";
    }

    private String formatStatus(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }

        String normalized = value.replace('_', ' ').toLowerCase();
        return Character.toUpperCase(normalized.charAt(0)) + normalized.substring(1);
    }

    private Project getAccessibleProject(String email, Long projectId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        return projectRepository.findByIdAndUserId(projectId, user.getId())
                .orElseGet(() -> projectRepository.findById(projectId)
                        .filter(p -> collaboratorRepository
                                .findByProjectIdAndUserIdAndStatus(projectId, user.getId(), CollaboratorStatus.ACCEPTED)
                                .isPresent())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found")));
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
