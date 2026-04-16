package tn.forma.users.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import tn.forma.users.model.CreationMethod;
import tn.forma.users.model.Project;
import tn.forma.users.model.ProjectProduct;
import tn.forma.users.model.ProjectProductStatus;
import tn.forma.users.model.ProjectProductType;
import tn.forma.users.model.ProjectStatus;
import tn.forma.users.model.ProjectStorefront;
import tn.forma.users.model.ProjectType;
import tn.forma.users.model.StorefrontStatus;
import tn.forma.users.model.User;
import tn.forma.users.repository.ProjectProductRepository;
import tn.forma.users.repository.ProjectRepository;
import tn.forma.users.repository.ProjectStorefrontRepository;
import tn.forma.users.repository.UserRepository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PublicStorefrontServiceTest {

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private ProjectStorefrontRepository projectStorefrontRepository;

    @Mock
    private ProjectProductRepository projectProductRepository;

    @Mock
    private UserRepository userRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void getPublishedStorefrontHomeReturnsPublishedHomepageAndFeaturedProducts() {
        Project project = buildProject();
        ProjectStorefront storefront = buildPublishedStorefront(project, List.of(11L, 13L), 2);
        List<ProjectProduct> products = List.of(
                buildProduct(project, 11L, "Amber Vase", ProjectProductStatus.ACTIVE, new BigDecimal("95.00"), 8, "https://img/amber.png"),
                buildProduct(project, 12L, "Draft Lamp", ProjectProductStatus.DRAFT, new BigDecimal("120.00"), 9, "https://img/lamp.png"),
                buildProduct(project, 13L, "Oak Shelf", ProjectProductStatus.ACTIVE, new BigDecimal("180.00"), 4, "https://img/oak.png"),
                buildProduct(project, 14L, "No Image", ProjectProductStatus.ACTIVE, new BigDecimal("60.00"), 5, null)
        );

        when(projectRepository.findById(project.getId())).thenReturn(Optional.of(project));
        when(projectStorefrontRepository.findByProjectId(project.getId())).thenReturn(Optional.of(storefront));
        when(projectProductRepository.findAllByProjectIdOrderByUpdatedAtDesc(project.getId())).thenReturn(products);
        when(projectProductRepository.findByIdAndProjectId(11L, project.getId())).thenReturn(Optional.of(products.get(0)));

        PublicStorefrontService service = new PublicStorefrontService(
                projectRepository,
                projectStorefrontRepository,
                projectProductRepository,
                userRepository
        );

        var home = service.getPublishedStorefrontHome(project.getId());
        var productList = service.getPublishedProducts(project.getId());
        var product = service.getPublishedProduct(project.getId(), 11L);

        assertThat(home.getStoreName()).isEqualTo("Forma Shop");
        assertThat(home.getHomepage().path("seo").path("title").asText()).isEqualTo("Forma Shop");
        assertThat(home.getFeaturedProducts()).extracting("id").containsExactly(11L, 13L);
        assertThat(productList).extracting("id").containsExactly(11L, 13L);
        assertThat(product.getName()).isEqualTo("Amber Vase");
    }

    @Test
    void getPublishedProductsRejectsUnpublishedStorefront() {
        Project project = buildProject();
        ProjectStorefront storefront = ProjectStorefront.builder()
                .id(21L)
                .project(project)
                .storeName("Forma Shop")
                .storeStatus(StorefrontStatus.DRAFT)
                .draftHomepageJson(objectMapper.createObjectNode())
                .build();

        when(projectRepository.findById(project.getId())).thenReturn(Optional.of(project));
        when(projectStorefrontRepository.findByProjectId(project.getId())).thenReturn(Optional.of(storefront));

        PublicStorefrontService service = new PublicStorefrontService(
                projectRepository,
                projectStorefrontRepository,
                projectProductRepository,
                userRepository
        );

        assertThatThrownBy(() -> service.getPublishedProducts(project.getId()))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Storefront is not published");
    }

    @Test
    void getPreviewStorefrontHomeReturnsDraftHomepageAndPreviewProducts() {
        Project project = buildProject();
        User user = project.getUser();

        ObjectNode draftHomepage = objectMapper.createObjectNode();
        draftHomepage.put("version", 1);
        draftHomepage.put("pageKey", "home");
        draftHomepage.set("seo", objectMapper.createObjectNode().put("title", "Draft shop"));
        ArrayNode sections = objectMapper.createArrayNode();
        ObjectNode featuredSection = objectMapper.createObjectNode();
        featuredSection.put("id", "featured-products-1");
        featuredSection.put("type", "featured-products");
        featuredSection.put("enabled", true);
        ObjectNode props = objectMapper.createObjectNode();
        ArrayNode ids = objectMapper.createArrayNode();
        ids.add(12L);
        props.set("productIds", ids);
        props.put("maxItems", 4);
        featuredSection.set("props", props);
        sections.add(featuredSection);
        draftHomepage.set("sections", sections);

        ProjectStorefront storefront = ProjectStorefront.builder()
                .id(22L)
                .project(project)
                .storeName("Forma Shop")
                .storeStatus(StorefrontStatus.DRAFT)
                .draftHomepageJson(draftHomepage)
                .publishedHomepageJson(objectMapper.createObjectNode().put("version", 99))
                .build();

        ProjectProduct draftProduct = buildProduct(
                project,
                12L,
                "Preview Chair",
                ProjectProductStatus.DRAFT,
                new BigDecimal("210.00"),
                0,
                null
        );

        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(projectRepository.findByIdAndUserId(project.getId(), user.getId())).thenReturn(Optional.of(project));
        when(projectStorefrontRepository.findByProjectId(project.getId())).thenReturn(Optional.of(storefront));
        when(projectProductRepository.findAllByProjectIdOrderByUpdatedAtDesc(project.getId())).thenReturn(List.of(draftProduct));

        PublicStorefrontService service = new PublicStorefrontService(
                projectRepository,
                projectStorefrontRepository,
                projectProductRepository,
                userRepository
        );

        var home = service.getPreviewStorefrontHome(user.getEmail(), project.getId());
        var products = service.getPreviewProducts(user.getEmail(), project.getId());

        assertThat(home.getHomepage().path("seo").path("title").asText()).isEqualTo("Draft shop");
        assertThat(home.getFeaturedProducts()).extracting("id").containsExactly(12L);
        assertThat(products).extracting("id").containsExactly(12L);
    }

    private Project buildProject() {
        User user = User.builder()
                .id(5L)
                .email("owner@forma.test")
                .firstName("Store")
                .lastName("Owner")
                .password("secret")
                .build();

        return Project.builder()
                .id(9L)
                .user(user)
                .name("Forma Shop")
                .type(ProjectType.ECOMMERCE)
                .creationMethod(CreationMethod.GUIDED_SETUP)
                .status(ProjectStatus.DRAFT)
                .build();
    }

    private ProjectStorefront buildPublishedStorefront(Project project, List<Long> featuredProductIds, int maxItems) {
        ObjectNode homepage = objectMapper.createObjectNode();
        homepage.put("version", 1);
        homepage.put("pageKey", "home");
        homepage.set("seo", objectMapper.createObjectNode().put("title", "Forma Shop").put("description", "Curated home goods"));

        ArrayNode sections = objectMapper.createArrayNode();
        ObjectNode featuredSection = objectMapper.createObjectNode();
        featuredSection.put("id", "featured-products-1");
        featuredSection.put("type", "featured-products");
        featuredSection.put("enabled", true);
        ObjectNode props = objectMapper.createObjectNode();
        props.put("title", "Featured");
        ArrayNode ids = objectMapper.createArrayNode();
        featuredProductIds.forEach(ids::add);
        props.set("productIds", ids);
        props.put("maxItems", maxItems);
        featuredSection.set("props", props);
        sections.add(featuredSection);
        homepage.set("sections", sections);

        return ProjectStorefront.builder()
                .id(21L)
                .project(project)
                .storeName("Forma Shop")
                .storeStatus(StorefrontStatus.PUBLISHED)
                .themeKey("commerce-minimal")
                .activePageKey("home")
                .draftHomepageJson(homepage.deepCopy())
                .publishedHomepageJson(homepage)
                .build();
    }

    private ProjectProduct buildProduct(
            Project project,
            Long id,
            String name,
            ProjectProductStatus status,
            BigDecimal price,
            int inventoryQuantity,
            String imageUrl
    ) {
        return ProjectProduct.builder()
                .id(id)
                .project(project)
                .name(name)
                .description(name + " description")
                .sku("SKU-" + id)
                .category("Decor")
                .productType(ProjectProductType.PHYSICAL)
                .status(status)
                .price(price)
                .inventoryQuantity(inventoryQuantity)
                .imageUrl(imageUrl)
                .tagsCsv("featured,home")
                .build();
    }
}
