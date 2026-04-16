package tn.forma.users.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import tn.forma.users.dto.CreateProjectProductRequest;
import tn.forma.users.dto.ProjectCatalogPageDto;
import tn.forma.users.dto.UpdateProjectProductRequest;
import tn.forma.users.model.CreationMethod;
import tn.forma.users.model.Project;
import tn.forma.users.model.ProjectProduct;
import tn.forma.users.model.ProjectProductStatus;
import tn.forma.users.model.ProjectProductType;
import tn.forma.users.model.ProjectStatus;
import tn.forma.users.model.ProjectType;
import tn.forma.users.model.User;
import tn.forma.users.repository.ProjectProductRepository;
import tn.forma.users.repository.ProjectRepository;
import tn.forma.users.repository.UserRepository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProjectCatalogServiceTest {

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private ProjectProductRepository projectProductRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ProjectCatalogService projectCatalogService;

    @Test
    void getCatalogPageBuildsSummaryAndFiltersProducts() {
        User user = buildUser();
        Project project = buildProject(user);

        ProjectProduct activeProduct = ProjectProduct.builder()
                .id(11L)
                .project(project)
                .name("Olive Oil")
                .sku("OO-1")
                .category("Pantry")
                .productType(ProjectProductType.PHYSICAL)
                .status(ProjectProductStatus.ACTIVE)
                .price(new BigDecimal("24.00"))
                .inventoryQuantity(3)
                .imageUrl("https://cdn.example.com/olive-oil.jpg")
                .active(true)
                .build();

        ProjectProduct draftProduct = ProjectProduct.builder()
                .id(12L)
                .project(project)
                .name("Website Audit")
                .category("Services")
                .productType(ProjectProductType.SERVICE)
                .status(ProjectProductStatus.DRAFT)
                .price(new BigDecimal("80.00"))
                .inventoryQuantity(10)
                .active(false)
                .build();

        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(projectRepository.findByIdAndUserId(project.getId(), user.getId())).thenReturn(Optional.of(project));
        when(projectProductRepository.findAllByProjectIdOrderByUpdatedAtDesc(project.getId()))
                .thenReturn(List.of(activeProduct, draftProduct));

        ProjectCatalogPageDto page = projectCatalogService.getCatalogPage(
                user.getEmail(),
                project.getId(),
                "olive",
                "ACTIVE",
                "Pantry"
        );

        assertThat(page.getProducts()).hasSize(1);
        assertThat(page.getProducts().get(0).getName()).isEqualTo("Olive Oil");
        assertThat(page.getSummary().getTotalProducts()).isEqualTo(2);
        assertThat(page.getSummary().getActiveProducts()).isEqualTo(1);
        assertThat(page.getSummary().getDraftProducts()).isEqualTo(1);
        assertThat(page.getSummary().getLowStockProducts()).isEqualTo(1);
    }

    @Test
    void createAndUpdateProductPersistCatalogFields() {
        User user = buildUser();
        Project project = buildProject(user);

        CreateProjectProductRequest createRequest = new CreateProjectProductRequest();
        createRequest.setName("Starter Kit");
        createRequest.setDescription("Starter setup package");
        createRequest.setSku("KIT-1");
        createRequest.setCategory("Bundles");
        createRequest.setProductType(ProjectProductType.DIGITAL);
        createRequest.setStatus(ProjectProductStatus.DRAFT);
        createRequest.setPrice(new BigDecimal("49.00"));
        createRequest.setCompareAtPrice(new BigDecimal("59.00"));
        createRequest.setInventoryQuantity(12);
        createRequest.setImageUrl("https://cdn.example.com/starter-kit.png");
        createRequest.setTags(List.of("featured", "new"));

        ProjectProduct savedProduct = ProjectProduct.builder()
                .id(88L)
                .project(project)
                .name(createRequest.getName())
                .description(createRequest.getDescription())
                .sku(createRequest.getSku())
                .category(createRequest.getCategory())
                .productType(createRequest.getProductType())
                .status(createRequest.getStatus())
                .price(createRequest.getPrice())
                .compareAtPrice(createRequest.getCompareAtPrice())
                .inventoryQuantity(createRequest.getInventoryQuantity())
                .imageUrl(createRequest.getImageUrl())
                .tagsCsv("featured,new")
                .active(false)
                .build();

        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(projectRepository.findByIdAndUserId(project.getId(), user.getId())).thenReturn(Optional.of(project));
        when(projectProductRepository.save(any(ProjectProduct.class))).thenReturn(savedProduct);

        var created = projectCatalogService.createProduct(user.getEmail(), project.getId(), createRequest);

        assertThat(created.getTags()).containsExactly("featured", "new");
        assertThat(created.getStatus()).isEqualTo(ProjectProductStatus.DRAFT);

        UpdateProjectProductRequest updateRequest = new UpdateProjectProductRequest();
        updateRequest.setStatus(ProjectProductStatus.ACTIVE);
        updateRequest.setInventoryQuantity(4);

        when(projectProductRepository.findByIdAndProjectId(savedProduct.getId(), project.getId()))
                .thenReturn(Optional.of(savedProduct));
        when(projectProductRepository.save(any(ProjectProduct.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var updated = projectCatalogService.updateProduct(
                user.getEmail(),
                project.getId(),
                savedProduct.getId(),
                updateRequest
        );

        assertThat(updated.getStatus()).isEqualTo(ProjectProductStatus.ACTIVE);
        assertThat(updated.getInventoryQuantity()).isEqualTo(4);
    }

    private User buildUser() {
        return User.builder()
                .id(5L)
                .email("owner@forma.test")
                .firstName("Store")
                .lastName("Owner")
                .password("secret")
                .build();
    }

    private Project buildProject(User user) {
        return Project.builder()
                .id(9L)
                .user(user)
                .name("Forma Shop")
                .type(ProjectType.ECOMMERCE)
                .creationMethod(CreationMethod.GUIDED_SETUP)
                .status(ProjectStatus.DRAFT)
                .build();
    }
}
