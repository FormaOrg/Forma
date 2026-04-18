package tn.forma.users.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import tn.forma.users.model.CreationMethod;
import tn.forma.users.model.Project;
import tn.forma.users.model.ProjectStatus;
import tn.forma.users.model.ProjectType;
import tn.forma.users.model.User;
import tn.forma.users.repository.ProjectRepository;
import tn.forma.users.repository.UserRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProjectServiceTest {

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private TemplateService templateService;

    @Mock
    private FileUploadService fileUploadService;

    @Mock
    private PortfolioPageService portfolioPageService;

    @Mock
    private PortfolioInquiryService portfolioInquiryService;

    @Mock
    private ProjectCollaboratorService projectCollaboratorService;

    @InjectMocks
    private ProjectService projectService;

    @Test
    void getMyProjectsIncludesAcceptedCollaboratorProjects() {
        User user = buildUser();
        Project ownedProject = buildProject(9L, user, "Owned project", LocalDateTime.of(2026, 4, 18, 10, 0));
        Project collaboratedProject = buildProject(
                11L,
                buildUser(8L, "owner@forma.test"),
                "Collaborated project",
                LocalDateTime.of(2026, 4, 18, 12, 0)
        );

        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(projectRepository.findAllByUserIdOrderByUpdatedAtDesc(user.getId())).thenReturn(List.of(ownedProject));
        when(projectCollaboratorService.getAcceptedCollaboratorProjects(user)).thenReturn(List.of(collaboratedProject));

        var result = projectService.getMyProjects(user.getEmail());

        assertThat(result).hasSize(2);
        assertThat(result.get(0).getId()).isEqualTo(11L);
        assertThat(result.get(1).getId()).isEqualTo(9L);
    }

    private User buildUser() {
        return buildUser(5L, "editor@forma.test");
    }

    private User buildUser(Long id, String email) {
        return User.builder()
                .id(id)
                .email(email)
                .firstName("Test")
                .lastName("User")
                .password("secret")
                .build();
    }

    private Project buildProject(Long id, User owner, String name, LocalDateTime updatedAt) {
        return Project.builder()
                .id(id)
                .user(owner)
                .name(name)
                .type(ProjectType.ECOMMERCE)
                .creationMethod(CreationMethod.GUIDED_SETUP)
                .status(ProjectStatus.DRAFT)
                .updatedAt(updatedAt)
                .createdAt(updatedAt.minusHours(1))
                .build();
    }
}
