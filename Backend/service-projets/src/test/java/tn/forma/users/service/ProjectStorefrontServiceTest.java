package tn.forma.users.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import tn.forma.users.dto.UpdateProjectStorefrontRequest;
import tn.forma.users.model.CreationMethod;
import tn.forma.users.model.Project;
import tn.forma.users.model.ProjectStatus;
import tn.forma.users.model.ProjectStorefront;
import tn.forma.users.model.ProjectType;
import tn.forma.users.model.StorefrontStatus;
import tn.forma.users.model.User;
import tn.forma.users.repository.ProjectRepository;
import tn.forma.users.repository.ProjectStorefrontRepository;
import tn.forma.users.repository.UserRepository;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProjectStorefrontServiceTest {

    @Mock
    private ProjectStorefrontRepository projectStorefrontRepository;

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private UserRepository userRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void getStorefrontCreatesDefaultDraftForOwnedEcommerceProject() {
        User user = buildUser();
        Project project = buildProject(user);

        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(projectRepository.findByIdAndUserId(project.getId(), user.getId())).thenReturn(Optional.of(project));
        when(projectStorefrontRepository.findByProjectId(project.getId())).thenReturn(Optional.empty());
        when(projectStorefrontRepository.save(any(ProjectStorefront.class))).thenAnswer(invocation -> {
            ProjectStorefront storefront = invocation.getArgument(0);
            storefront.setId(77L);
            return storefront;
        });

        ProjectStorefrontService service = new ProjectStorefrontService(
                projectStorefrontRepository,
                projectRepository,
                userRepository,
                objectMapper
        );

        var storefront = service.getStorefront(user.getEmail(), project.getId());
        JsonNode draftHomepage = (JsonNode) storefront.getDraftHomepage();

        assertThat(storefront.getId()).isEqualTo(77L);
        assertThat(storefront.getStoreStatus()).isEqualTo(StorefrontStatus.DRAFT.name());
        assertThat(storefront.getStoreName()).isEqualTo("Forma Shop");
        assertThat(draftHomepage.get("sections")).hasSize(4);
    }

    @Test
    void updateAndPublishStorefrontPersistDraftAndPublishedContent() throws Exception {
        User user = buildUser();
        Project project = buildProject(user);

        JsonNode draftHomepage = objectMapper.readTree("""
                {
                  "version": 1,
                  "pageKey": "home",
                  "seo": { "title": "Updated shop", "description": "Fresh copy" },
                  "sections": []
                }
                """);

        ProjectStorefront storefront = ProjectStorefront.builder()
                .id(91L)
                .project(project)
                .storeName("Forma Shop")
                .storeStatus(StorefrontStatus.DRAFT)
                .themeKey("commerce-minimal")
                .activePageKey("home")
                .draftHomepageJson(objectMapper.createObjectNode().put("version", 1))
                .build();

        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(projectRepository.findByIdAndUserId(project.getId(), user.getId())).thenReturn(Optional.of(project));
        when(projectStorefrontRepository.findByProjectId(project.getId())).thenReturn(Optional.of(storefront));
        when(projectStorefrontRepository.save(any(ProjectStorefront.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ProjectStorefrontService service = new ProjectStorefrontService(
                projectStorefrontRepository,
                projectRepository,
                userRepository,
                objectMapper
        );

        UpdateProjectStorefrontRequest updateRequest = new UpdateProjectStorefrontRequest();
        updateRequest.setStoreName("Updated shop");
        updateRequest.setDraftHomepage(draftHomepage);

        var updated = service.updateStorefront(user.getEmail(), project.getId(), updateRequest);
        JsonNode updatedDraftHomepage = (JsonNode) updated.getDraftHomepage();
        assertThat(updated.getStoreName()).isEqualTo("Updated shop");
        assertThat(updatedDraftHomepage.get("seo").get("title").asText()).isEqualTo("Updated shop");

        var published = service.publishStorefront(user.getEmail(), project.getId());
        JsonNode publishedHomepage = (JsonNode) published.getStorefront().getPublishedHomepage();
        assertThat(published.getStorefront().getStoreStatus()).isEqualTo(StorefrontStatus.PUBLISHED.name());
        assertThat(publishedHomepage.get("seo").get("title").asText()).isEqualTo("Updated shop");
        assertThat(published.getPublishedAt()).isNotBlank();
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
