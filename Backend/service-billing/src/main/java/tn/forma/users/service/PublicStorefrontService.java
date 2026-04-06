package tn.forma.users.service;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.forma.users.dto.PublicStorefrontHomeDto;
import tn.forma.users.dto.PublicStorefrontProductDto;
import tn.forma.users.model.Project;
import tn.forma.users.model.ProjectProduct;
import tn.forma.users.model.ProjectProductStatus;
import tn.forma.users.model.ProjectStorefront;
import tn.forma.users.model.ProjectType;
import tn.forma.users.model.StorefrontStatus;
import tn.forma.users.repository.ProjectProductRepository;
import tn.forma.users.repository.ProjectRepository;
import tn.forma.users.repository.ProjectStorefrontRepository;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class PublicStorefrontService {

    private final ProjectRepository projectRepository;
    private final ProjectStorefrontRepository projectStorefrontRepository;
    private final ProjectProductRepository projectProductRepository;

    public PublicStorefrontHomeDto getPublishedStorefrontHome(Long projectId) {
        Project project = getPublishedEcommerceProject(projectId);
        ProjectStorefront storefront = getPublishedStorefront(project.getId());
        List<PublicStorefrontProductDto> featuredProducts = resolveFeaturedProducts(
                storefront.getPublishedHomepageJson(),
                getPublishedProducts(project.getId())
        );

        return PublicStorefrontHomeDto.builder()
                .projectId(project.getId())
                .storeName(resolveStoreName(storefront, project))
                .themeKey(storefront.getThemeKey())
                .homepage(storefront.getPublishedHomepageJson() != null
                        ? storefront.getPublishedHomepageJson().deepCopy()
                        : null)
                .featuredProducts(featuredProducts)
                .build();
    }

    public List<PublicStorefrontProductDto> getPublishedProducts(Long projectId) {
        Project project = getPublishedEcommerceProject(projectId);
        getPublishedStorefront(project.getId());

        return projectProductRepository.findAllByProjectIdOrderByUpdatedAtDesc(project.getId()).stream()
                .filter(this::isPubliclyVisible)
                .map(this::mapToProductDto)
                .toList();
    }

    public PublicStorefrontProductDto getPublishedProduct(Long projectId, Long productId) {
        Project project = getPublishedEcommerceProject(projectId);
        getPublishedStorefront(project.getId());

        ProjectProduct product = projectProductRepository.findByIdAndProjectId(productId, project.getId())
                .orElseThrow(() -> new RuntimeException("Product not found"));

        if (!isPubliclyVisible(product)) {
            throw new RuntimeException("Product not found");
        }

        return mapToProductDto(product);
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

    private List<PublicStorefrontProductDto> resolveFeaturedProducts(
            JsonNode publishedHomepage,
            List<PublicStorefrontProductDto> publishedProducts
    ) {
        if (publishedHomepage == null || !publishedHomepage.has("sections")) {
            return List.of();
        }

        JsonNode featuredSection = null;
        for (JsonNode section : publishedHomepage.get("sections")) {
            if ("featured-products".equals(section.path("type").asText()) && section.path("enabled").asBoolean(true)) {
                featuredSection = section;
                break;
            }
        }

        if (featuredSection == null) {
            return List.of();
        }

        int maxItems = featuredSection.path("props").path("maxItems").asInt(4);
        Set<Long> productIds = new LinkedHashSet<>();
        JsonNode productIdsNode = featuredSection.path("props").path("productIds");
        if (productIdsNode.isArray()) {
            for (JsonNode productIdNode : productIdsNode) {
                if (productIdNode.canConvertToLong()) {
                    productIds.add(productIdNode.asLong());
                }
            }
        }

        List<PublicStorefrontProductDto> orderedProducts = new ArrayList<>();
        for (Long productId : productIds) {
            publishedProducts.stream()
                    .filter(product -> Objects.equals(product.getId(), productId))
                    .findFirst()
                    .ifPresent(orderedProducts::add);
            if (orderedProducts.size() >= maxItems) {
                break;
            }
        }

        return orderedProducts;
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

    private PublicStorefrontProductDto mapToProductDto(ProjectProduct product) {
        return PublicStorefrontProductDto.builder()
                .id(product.getId())
                .name(product.getName())
                .description(product.getDescription())
                .sku(product.getSku())
                .category(product.getCategory())
                .productType(product.getProductType())
                .price(product.getPrice())
                .compareAtPrice(product.getCompareAtPrice())
                .inventoryQuantity(product.getInventoryQuantity() != null ? product.getInventoryQuantity() : 0)
                .imageUrl(product.getImageUrl())
                .tags(fromTagsCsv(product.getTagsCsv()))
                .createdAt(Objects.toString(product.getCreatedAt(), null))
                .updatedAt(Objects.toString(product.getUpdatedAt(), null))
                .build();
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

    private String resolveStoreName(ProjectStorefront storefront, Project project) {
        if (storefront.getStoreName() != null && !storefront.getStoreName().isBlank()) {
            return storefront.getStoreName();
        }
        if (project.getStoreTitle() != null && !project.getStoreTitle().isBlank()) {
            return project.getStoreTitle();
        }
        return project.getName();
    }
}
