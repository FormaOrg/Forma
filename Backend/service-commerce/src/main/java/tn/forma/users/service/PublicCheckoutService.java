package tn.forma.users.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.forma.users.dto.PublicCheckoutItemRequest;
import tn.forma.users.dto.PublicCheckoutRequest;
import tn.forma.users.dto.PublicCheckoutResponse;
import tn.forma.users.model.OrderFulfillmentStatus;
import tn.forma.users.model.OrderPaymentStatus;
import tn.forma.users.model.Project;
import tn.forma.users.model.ProjectCustomer;
import tn.forma.users.model.ProjectOrder;
import tn.forma.users.model.ProjectOrderItem;
import tn.forma.users.model.ProjectProduct;
import tn.forma.users.model.ProjectProductStatus;
import tn.forma.users.model.ProjectStorefront;
import tn.forma.users.model.ProjectType;
import tn.forma.users.model.StorefrontStatus;
import tn.forma.users.repository.ProjectCustomerRepository;
import tn.forma.users.repository.ProjectOrderRepository;
import tn.forma.users.repository.ProjectProductRepository;
import tn.forma.users.repository.ProjectRepository;
import tn.forma.users.repository.ProjectStorefrontRepository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PublicCheckoutService {

    private static final String DEFAULT_CURRENCY = "TND";

    private final ProjectRepository projectRepository;
    private final ProjectStorefrontRepository projectStorefrontRepository;
    private final ProjectProductRepository projectProductRepository;
    private final ProjectCustomerRepository projectCustomerRepository;
    private final ProjectOrderRepository projectOrderRepository;

    @Transactional
    public PublicCheckoutResponse checkout(Long projectId, PublicCheckoutRequest request) {
        Project project = getPublishedEcommerceProject(projectId);
        getPublishedStorefront(project.getId());

        ProjectCustomer customer = findOrCreateCustomer(project, request);

        List<ProjectOrderItem> orderItems = new ArrayList<>();
        BigDecimal subtotal = BigDecimal.ZERO;

        for (PublicCheckoutItemRequest itemRequest : request.getItems()) {
            ProjectProduct product = projectProductRepository.findByIdAndProjectId(itemRequest.getProductId(), project.getId())
                    .orElseThrow(() -> new RuntimeException("Product not found"));

            if (!isPubliclyVisible(product)) {
                throw new RuntimeException("Product not found");
            }

            BigDecimal unitPrice = amount(product.getPrice());
            BigDecimal lineTotal = amount(unitPrice.multiply(BigDecimal.valueOf(itemRequest.getQuantity())));

            ProjectOrderItem orderItem = ProjectOrderItem.builder()
                    .product(product)
                    .productName(product.getName())
                    .productSku(product.getSku())
                    .quantity(itemRequest.getQuantity())
                    .unitPrice(unitPrice)
                    .lineTotal(lineTotal)
                    .build();

            orderItems.add(orderItem);
            subtotal = subtotal.add(lineTotal);
        }

        ProjectOrder order = new ProjectOrder();
        order.setProject(project);
        order.setCustomer(customer);
        order.setOrderNumber(generateOrderNumber());
        order.setPlacedAt(LocalDateTime.now());
        order.setPaymentStatus(OrderPaymentStatus.DUE_ON_DELIVERY);
        order.setFulfillmentStatus(OrderFulfillmentStatus.NEW);
        order.setSubtotal(amount(subtotal));
        order.setDeliveryFee(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
        order.setTotal(amount(subtotal));
        order.setDeliveryAddress(requireValue(request.getAddress(), "Address is required"));
        order.setNotes(blankToNull(request.getNotes()));

        for (ProjectOrderItem item : orderItems) {
            item.setOrder(order);
        }
        order.getItems().addAll(orderItems);

        ProjectOrder savedOrder = projectOrderRepository.save(order);

        return PublicCheckoutResponse.builder()
                .orderId(savedOrder.getId())
                .orderNumber(savedOrder.getOrderNumber())
                .total(amount(savedOrder.getTotal()))
                .currencyCode(DEFAULT_CURRENCY)
                .build();
    }

    private Project getPublishedEcommerceProject(Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        if (project.getType() != ProjectType.ECOMMERCE) {
            throw new RuntimeException("Storefront is only available for ecommerce projects");
        }

        return project;
    }

    private ProjectStorefront getPublishedStorefront(Long projectId) {
        ProjectStorefront storefront = projectStorefrontRepository.findByProjectId(projectId)
                .orElseThrow(() -> new RuntimeException("Storefront not found"));

        if (storefront.getStoreStatus() != StorefrontStatus.PUBLISHED || storefront.getPublishedHomepageJson() == null) {
            throw new RuntimeException("Storefront is not published");
        }

        return storefront;
    }

    private ProjectCustomer findOrCreateCustomer(Project project, PublicCheckoutRequest request) {
        String email = blankToNull(request.getEmail());
        String phone = requireValue(request.getPhone(), "Phone is required");

        Optional<ProjectCustomer> existing = email != null
                ? projectCustomerRepository.findFirstByProjectIdAndEmailIgnoreCase(project.getId(), email)
                : Optional.empty();

        if (existing.isEmpty()) {
            existing = projectCustomerRepository.findFirstByProjectIdAndPhone(project.getId(), phone);
        }

        ProjectCustomer customer = existing.orElseGet(() -> ProjectCustomer.builder()
                .project(project)
                .build());

        customer.setFirstName(requireValue(request.getFirstName(), "First name is required"));
        customer.setLastName(requireValue(request.getLastName(), "Last name is required"));
        customer.setEmail(email);
        customer.setPhone(phone);
        customer.setAddress(requireValue(request.getAddress(), "Address is required"));

        return projectCustomerRepository.save(customer);
    }

    private boolean isPubliclyVisible(ProjectProduct product) {
        return product.getStatus() == ProjectProductStatus.ACTIVE
                && buildReadinessIssues(product).isEmpty();
    }

    private List<String> buildReadinessIssues(ProjectProduct product) {
        List<String> issues = new ArrayList<>();

        if (product.getName() == null || product.getName().isBlank()) {
            issues.add("Add a product name");
        }
        if (product.getPrice() == null || product.getPrice().compareTo(BigDecimal.ZERO) <= 0) {
            issues.add("Set a selling price");
        }
        if (product.getImageUrl() == null || product.getImageUrl().isBlank()) {
            issues.add("Upload a cover image");
        }
        if (product.getInventoryQuantity() == null || product.getInventoryQuantity() <= 0) {
            issues.add("Restock inventory before publishing");
        }

        return issues;
    }

    private BigDecimal amount(BigDecimal value) {
        return (value == null ? BigDecimal.ZERO : value).setScale(2, RoundingMode.HALF_UP);
    }

    private String generateOrderNumber() {
        long suffix = Math.abs(System.currentTimeMillis()) % 1_000_000L;
        return "ORD-" + LocalDateTime.now().getYear() + "-" + String.format(Locale.ROOT, "%06d", suffix);
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
}
