package tn.forma.users.service;

import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.forma.users.dto.CreateProjectProductRequest;
import tn.forma.users.dto.ProjectCatalogPageDto;
import tn.forma.users.dto.ProjectCatalogProductDto;
import tn.forma.users.dto.ProjectCatalogSummaryDto;
import tn.forma.users.dto.UpdateProjectProductRequest;
import tn.forma.users.model.Project;
import tn.forma.users.model.ProjectProduct;
import tn.forma.users.model.ProjectProductStatus;
import tn.forma.users.model.ProjectProductType;
import tn.forma.users.model.User;
import tn.forma.users.repository.ProjectOrderRepository;
import tn.forma.users.repository.ProjectProductRepository;
import tn.forma.users.repository.ProjectRepository;
import tn.forma.users.repository.UserRepository;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class ProjectCatalogService {

    private static final int LOW_STOCK_THRESHOLD = 5;

    private final ProjectRepository projectRepository;
    private final ProjectProductRepository projectProductRepository;
    private final ProjectOrderRepository projectOrderRepository;
    private final UserRepository userRepository;
    private final JdbcTemplate jdbcTemplate;
    private final ProjectAccessService projectAccessService;

    public ProjectCatalogPageDto getCatalogPage(
            String email,
            Long projectId,
            String search,
            String status,
            String category
    ) {
        Project project = getAccessibleProject(email, projectId);
        List<ProjectProduct> allProducts = projectProductRepository.findAllByProjectIdOrderByUpdatedAtDesc(project.getId());
        List<ProjectCatalogProductDto> mappedProducts = allProducts.stream()
                .map(this::mapToDto)
                .toList();

        String normalizedSearch = normalize(search);
        String normalizedCategory = normalize(category);
        ProjectProductStatus statusFilter = parseStatus(status);

        List<ProjectCatalogProductDto> filteredProducts = mappedProducts.stream()
                .filter(product -> matchesSearch(product, normalizedSearch))
                .filter(product -> statusFilter == null || product.getStatus() == statusFilter)
                .filter(product -> normalizedCategory == null || normalizedCategory.equals(normalize(product.getCategory())))
                .sorted(Comparator.comparing(ProjectCatalogProductDto::getUpdatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();

        List<String> categories = allProducts.stream()
                .map(ProjectProduct::getCategory)
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(value -> !value.isEmpty())
                .distinct()
                .sorted(String.CASE_INSENSITIVE_ORDER)
                .toList();

        return ProjectCatalogPageDto.builder()
                .summary(buildSummary(mappedProducts))
                .products(filteredProducts)
                .categories(categories)
                .build();
    }

    @Transactional
    public ProjectCatalogProductDto createProduct(String email, Long projectId, CreateProjectProductRequest request) {
        Project project = getEditableProject(email, projectId);
        ProjectProduct product = buildProduct(project, request);

        syncProjectProductSequence();

        try {
            return mapToDto(projectProductRepository.saveAndFlush(product));
        } catch (DataIntegrityViolationException exception) {
            if (!isProjectProductPrimaryKeyConflict(exception)) {
                throw exception;
            }

            syncProjectProductSequence();
            return mapToDto(projectProductRepository.saveAndFlush(buildProduct(project, request)));
        }
    }

    @Transactional
    public ProjectCatalogProductDto updateProduct(
            String email,
            Long projectId,
            Long productId,
            UpdateProjectProductRequest request
    ) {
        getEditableProject(email, projectId);
        ProjectProduct product = getOwnedProduct(projectId, productId);

        if (request.getName() != null) {
            String name = blankToNull(request.getName());
            if (name == null) {
                throw new RuntimeException("Product name is required");
            }
            product.setName(name);
        }

        if (request.getDescription() != null) {
            product.setDescription(blankToNull(request.getDescription()));
        }

        if (request.getSku() != null) {
            product.setSku(blankToNull(request.getSku()));
        }

        if (request.getCategory() != null) {
            product.setCategory(blankToNull(request.getCategory()));
        }

        if (request.getProductType() != null) {
            product.setProductType(request.getProductType());
        }

        if (request.getStatus() != null) {
            product.setStatus(request.getStatus());
            product.setActive(request.getStatus() == ProjectProductStatus.ACTIVE);
        }

        if (request.getPrice() != null) {
            product.setPrice(request.getPrice());
        }

        if (request.getCompareAtPrice() != null || request.getCompareAtPrice() == null && request.getName() == null) {
            product.setCompareAtPrice(normalizePrice(request.getCompareAtPrice()));
        }

        if (request.getInventoryQuantity() != null) {
            product.setInventoryQuantity(request.getInventoryQuantity());
        }

        if (request.getImageUrl() != null) {
            product.setImageUrl(blankToNull(request.getImageUrl()));
        }

        if (request.getTags() != null) {
            product.setTagsCsv(toTagsCsv(request.getTags()));
        }

        return mapToDto(projectProductRepository.save(product));
    }

    @Transactional
    public void deleteProduct(String email, Long projectId, Long productId) {
        getEditableProject(email, projectId);
        ProjectProduct product = getOwnedProduct(projectId, productId);
        projectOrderRepository.deleteAll(projectOrderRepository.findAllByProjectIdAndProductId(projectId, productId));
        projectProductRepository.delete(product);
    }

    private ProjectCatalogSummaryDto buildSummary(List<ProjectCatalogProductDto> products) {
        int activeProducts = 0;
        int draftProducts = 0;
        int archivedProducts = 0;
        int lowStockProducts = 0;
        int readyToPublishProducts = 0;

        for (ProjectCatalogProductDto product : products) {
            if (product.getStatus() == ProjectProductStatus.ACTIVE) {
                activeProducts += 1;
            } else if (product.getStatus() == ProjectProductStatus.ARCHIVED) {
                archivedProducts += 1;
            } else {
                draftProducts += 1;
            }

            if (isLowStock(product)) {
                lowStockProducts += 1;
            }

            if (product.isReadyToPublish()) {
                readyToPublishProducts += 1;
            }
        }

        return ProjectCatalogSummaryDto.builder()
                .totalProducts(products.size())
                .activeProducts(activeProducts)
                .draftProducts(draftProducts)
                .archivedProducts(archivedProducts)
                .lowStockProducts(lowStockProducts)
                .readyToPublishProducts(readyToPublishProducts)
                .build();
    }

    private boolean matchesSearch(ProjectCatalogProductDto product, String search) {
        if (search == null) {
            return true;
        }

        return containsNormalized(product.getName(), search)
                || containsNormalized(product.getSku(), search)
                || containsNormalized(product.getCategory(), search)
                || containsNormalized(product.getDescription(), search)
                || product.getTags().stream().anyMatch(tag -> containsNormalized(tag, search));
    }

    private boolean containsNormalized(String value, String search) {
        return value != null && normalize(value) != null && normalize(value).contains(search);
    }

    private ProjectProductStatus parseStatus(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        try {
            return ProjectProductStatus.valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new RuntimeException("Invalid product status");
        }
    }

    private ProjectCatalogProductDto mapToDto(ProjectProduct product) {
        ProjectProductStatus status = product.getStatus() != null
                ? product.getStatus()
                : (product.isActive() ? ProjectProductStatus.ACTIVE : ProjectProductStatus.DRAFT);
        ProjectProductType productType = product.getProductType() != null
                ? product.getProductType()
                : ProjectProductType.PHYSICAL;
        List<String> tags = fromTagsCsv(product.getTagsCsv());
        List<String> readinessIssues = buildReadinessIssues(product.getName(), product.getPrice(), product.getImageUrl(), product.getInventoryQuantity(), status);

        return ProjectCatalogProductDto.builder()
                .id(product.getId())
                .name(product.getName())
                .description(product.getDescription())
                .sku(product.getSku())
                .category(product.getCategory())
                .productType(productType)
                .status(status)
                .price(product.getPrice())
                .compareAtPrice(product.getCompareAtPrice())
                .inventoryQuantity(product.getInventoryQuantity() != null ? product.getInventoryQuantity() : 0)
                .imageUrl(product.getImageUrl())
                .tags(tags)
                .readyToPublish(readinessIssues.isEmpty())
                .readinessIssues(readinessIssues)
                .createdAt(Objects.toString(product.getCreatedAt(), null))
                .updatedAt(Objects.toString(product.getUpdatedAt(), null))
                .build();
    }

    private List<String> buildReadinessIssues(
            String name,
            BigDecimal price,
            String imageUrl,
            Integer inventoryQuantity,
            ProjectProductStatus status
    ) {
        List<String> issues = new ArrayList<>();

        if (name == null || name.isBlank()) {
            issues.add("Add a product name");
        }
        if (price == null || price.compareTo(BigDecimal.ZERO) <= 0) {
            issues.add("Set a selling price");
        }
        if (imageUrl == null || imageUrl.isBlank()) {
            issues.add("Upload a cover image");
        }
        if (status == ProjectProductStatus.ACTIVE && (inventoryQuantity == null || inventoryQuantity <= 0)) {
            issues.add("Restock inventory before publishing");
        }

        return issues;
    }

    private boolean isLowStock(ProjectCatalogProductDto product) {
        return product.getStatus() != ProjectProductStatus.ARCHIVED
                && product.getInventoryQuantity() != null
                && product.getInventoryQuantity() <= LOW_STOCK_THRESHOLD;
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

    private ProjectProduct getOwnedProduct(Long projectId, Long productId) {
        return projectProductRepository.findByIdAndProjectId(productId, projectId)
                .orElseThrow(() -> new RuntimeException("Product not found"));
    }

    private ProjectProduct buildProduct(Project project, CreateProjectProductRequest request) {
        return ProjectProduct.builder()
                .project(project)
                .name(request.getName().trim())
                .description(blankToNull(request.getDescription()))
                .sku(blankToNull(request.getSku()))
                .category(blankToNull(request.getCategory()))
                .productType(request.getProductType())
                .status(request.getStatus())
                .price(request.getPrice())
                .compareAtPrice(normalizePrice(request.getCompareAtPrice()))
                .inventoryQuantity(request.getInventoryQuantity())
                .imageUrl(blankToNull(request.getImageUrl()))
                .tagsCsv(toTagsCsv(request.getTags()))
                .active(request.getStatus() == ProjectProductStatus.ACTIVE)
                .build();
    }

    private void syncProjectProductSequence() {
        if (jdbcTemplate == null) {
            return;
        }

        jdbcTemplate.execute("""
                SELECT setval(
                    pg_get_serial_sequence('project_products', 'id'),
                    COALESCE((SELECT MAX(id) FROM project_products), 1),
                    (SELECT COUNT(*) > 0 FROM project_products)
                );
                """);
    }

    private boolean isProjectProductPrimaryKeyConflict(DataIntegrityViolationException exception) {
        Throwable current = exception;
        while (current != null) {
            String message = current.getMessage();
            if (message != null
                    && message.contains("project_products_pkey")
                    && message.contains("duplicate key value")) {
                return true;
            }
            current = current.getCause();
        }
        return false;
    }

    private BigDecimal normalizePrice(BigDecimal price) {
        return price == null ? null : price.stripTrailingZeros();
    }

    private String blankToNull(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String normalize(String value) {
        String trimmed = blankToNull(value);
        return trimmed == null ? null : trimmed.toLowerCase(Locale.ROOT);
    }

    private String toTagsCsv(List<String> tags) {
        if (tags == null) {
            return null;
        }

        return tags.stream()
                .map(this::blankToNull)
                .filter(Objects::nonNull)
                .distinct()
                .limit(10)
                .reduce((left, right) -> left + "," + right)
                .orElse(null);
    }

    private List<String> fromTagsCsv(String tagsCsv) {
        if (tagsCsv == null || tagsCsv.isBlank()) {
            return List.of();
        }

        return List.of(tagsCsv.split(",")).stream()
                .map(String::trim)
                .filter(value -> !value.isEmpty())
                .toList();
    }
}
