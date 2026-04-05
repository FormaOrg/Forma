package tn.forma.users.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.forma.users.dto.ProjectStorefrontDto;
import tn.forma.users.dto.PublishProjectStorefrontResponse;
import tn.forma.users.dto.UpdateProjectStorefrontRequest;
import tn.forma.users.model.Project;
import tn.forma.users.model.ProjectStorefront;
import tn.forma.users.model.ProjectType;
import tn.forma.users.model.StorefrontStatus;
import tn.forma.users.model.User;
import tn.forma.users.repository.ProjectRepository;
import tn.forma.users.repository.ProjectStorefrontRepository;
import tn.forma.users.repository.UserRepository;

import java.time.LocalDateTime;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class ProjectStorefrontService {

    private static final String DEFAULT_THEME_KEY = "commerce-minimal";
    private static final String DEFAULT_PAGE_KEY = "home";

    private final ProjectStorefrontRepository projectStorefrontRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    public ProjectStorefrontDto getStorefront(String email, Long projectId) {
        ProjectStorefront storefront = getOrCreateOwnedStorefront(email, projectId);
        return mapToDto(storefront);
    }

    @Transactional
    public ProjectStorefrontDto updateStorefront(String email, Long projectId, UpdateProjectStorefrontRequest request) {
        ProjectStorefront storefront = getOrCreateOwnedStorefront(email, projectId);

        if (request.getStoreName() != null) {
            storefront.setStoreName(blankToNull(request.getStoreName()));
        }

        if (request.getThemeKey() != null) {
            storefront.setThemeKey(blankToNull(request.getThemeKey()));
        }

        if (request.getActivePageKey() != null) {
            String activePageKey = blankToNull(request.getActivePageKey());
            storefront.setActivePageKey(activePageKey != null ? activePageKey : DEFAULT_PAGE_KEY);
        }

        if (request.getDraftHomepage() != null) {
            storefront.setDraftHomepageJson(request.getDraftHomepage().deepCopy());
        }

        return mapToDto(projectStorefrontRepository.save(storefront));
    }

    @Transactional
    public PublishProjectStorefrontResponse publishStorefront(String email, Long projectId) {
        ProjectStorefront storefront = getOrCreateOwnedStorefront(email, projectId);
        storefront.setPublishedHomepageJson(storefront.getDraftHomepageJson());
        storefront.setStoreStatus(StorefrontStatus.PUBLISHED);
        storefront.setPublishedAt(LocalDateTime.now());

        ProjectStorefront savedStorefront = projectStorefrontRepository.save(storefront);
        return PublishProjectStorefrontResponse.builder()
                .storefront(mapToDto(savedStorefront))
                .publishedAt(Objects.toString(savedStorefront.getPublishedAt(), null))
                .build();
    }

    @Transactional
    public ProjectStorefrontDto unpublishStorefront(String email, Long projectId) {
        ProjectStorefront storefront = getOrCreateOwnedStorefront(email, projectId);
        storefront.setStoreStatus(StorefrontStatus.DRAFT);
        storefront.setPublishedHomepageJson(null);
        storefront.setPublishedAt(null);
        return mapToDto(projectStorefrontRepository.save(storefront));
    }

    private ProjectStorefront getOrCreateOwnedStorefront(String email, Long projectId) {
        Project project = getOwnedProject(email, projectId);
        ensureEcommerceProject(project);

        return projectStorefrontRepository.findByProjectId(project.getId())
                .orElseGet(() -> projectStorefrontRepository.save(buildDefaultStorefront(project)));
    }

    private Project getOwnedProject(String email, Long projectId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return projectRepository.findByIdAndUserId(projectId, user.getId())
                .orElseThrow(() -> new RuntimeException("Project not found"));
    }

    private void ensureEcommerceProject(Project project) {
        if (project.getType() != ProjectType.ECOMMERCE) {
            throw new RuntimeException("Storefront editing is only available for ecommerce projects");
        }
    }

    private ProjectStorefront buildDefaultStorefront(Project project) {
        return ProjectStorefront.builder()
                .project(project)
                .storeName(resolveStoreName(project))
                .storeStatus(StorefrontStatus.DRAFT)
                .themeKey(DEFAULT_THEME_KEY)
                .activePageKey(DEFAULT_PAGE_KEY)
                .draftHomepageJson(buildDefaultHomepage(project))
                .publishedHomepageJson(null)
                .publishedAt(null)
                .build();
    }

    private String resolveStoreName(Project project) {
        String storeTitle = blankToNull(project.getStoreTitle());
        if (storeTitle != null) {
            return storeTitle;
        }

        return blankToNull(project.getName());
    }

    private ObjectNode buildDefaultHomepage(Project project) {
        ObjectNode root = objectMapper.createObjectNode();
        root.put("version", 1);
        root.put("pageKey", DEFAULT_PAGE_KEY);

        ObjectNode seo = objectMapper.createObjectNode();
        seo.put("title", resolveStoreName(project) != null ? resolveStoreName(project) : "Storefront");
        seo.put("description", project.getMetaDescription() != null ? project.getMetaDescription() : "");
        root.set("seo", seo);

        ArrayNode sections = objectMapper.createArrayNode();
        sections.add(buildAnnouncementSection());
        sections.add(buildHeroSection(project));
        sections.add(buildFeaturedProductsSection());
        sections.add(buildFooterSection(project));
        root.set("sections", sections);

        return root;
    }

    private ObjectNode buildAnnouncementSection() {
        ObjectNode section = objectMapper.createObjectNode();
        section.put("id", "announcement-1");
        section.put("type", "announcement-bar");
        section.put("enabled", true);

        ObjectNode props = objectMapper.createObjectNode();
        props.put("text", "Welcome to your storefront");
        props.put("linkLabel", "Browse products");
        props.put("linkHref", "");
        section.set("props", props);
        return section;
    }

    private ObjectNode buildHeroSection(Project project) {
        ObjectNode section = objectMapper.createObjectNode();
        section.put("id", "hero-1");
        section.put("type", "hero");
        section.put("enabled", true);

        ObjectNode props = objectMapper.createObjectNode();
        props.put("eyebrow", "New store");
        props.put("title", resolveStoreName(project) != null ? resolveStoreName(project) : "Your store is ready");
        props.put("description", project.getDescription() != null ? project.getDescription() : "Add products and publish when you are ready.");
        props.put("primaryCtaLabel", "Browse products");
        props.put("primaryCtaHref", "");
        props.put("secondaryCtaLabel", "Featured picks");
        props.put("secondaryCtaHref", "#featured");
        section.set("props", props);
        return section;
    }

    private ObjectNode buildFeaturedProductsSection() {
        ObjectNode section = objectMapper.createObjectNode();
        section.put("id", "featured-products-1");
        section.put("type", "featured-products");
        section.put("enabled", true);

        ObjectNode props = objectMapper.createObjectNode();
        props.put("title", "Featured products");
        props.set("productIds", objectMapper.createArrayNode());
        props.put("maxItems", 4);
        section.set("props", props);
        return section;
    }

    private ObjectNode buildFooterSection(Project project) {
        ObjectNode section = objectMapper.createObjectNode();
        section.put("id", "footer-1");
        section.put("type", "footer");
        section.put("enabled", true);

        ObjectNode props = objectMapper.createObjectNode();
        props.put("brandText", resolveStoreName(project) != null ? resolveStoreName(project) : "Forma Store");
        props.put("contactEmail", project.getStoreEmail() != null ? project.getStoreEmail() : "");
        props.put("contactPhone", project.getContactPhone() != null ? project.getContactPhone() : "");
        section.set("props", props);
        return section;
    }

    private ProjectStorefrontDto mapToDto(ProjectStorefront storefront) {
        return ProjectStorefrontDto.builder()
                .id(storefront.getId())
                .projectId(storefront.getProject().getId())
                .storeName(storefront.getStoreName())
                .storeStatus(storefront.getStoreStatus().name())
                .themeKey(storefront.getThemeKey())
                .activePageKey(storefront.getActivePageKey())
                .draftHomepage(storefront.getDraftHomepageJson() != null ? storefront.getDraftHomepageJson().deepCopy() : null)
                .publishedHomepage(storefront.getPublishedHomepageJson() != null ? storefront.getPublishedHomepageJson().deepCopy() : null)
                .publishedAt(Objects.toString(storefront.getPublishedAt(), null))
                .createdAt(Objects.toString(storefront.getCreatedAt(), null))
                .updatedAt(Objects.toString(storefront.getUpdatedAt(), null))
                .build();
    }

    private String blankToNull(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
