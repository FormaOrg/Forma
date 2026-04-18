package tn.forma.users.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import tn.forma.users.dto.InviteCollaboratorRequest;
import tn.forma.users.model.CollaboratorRole;
import tn.forma.users.model.CollaboratorStatus;
import tn.forma.users.model.CreationMethod;
import tn.forma.users.model.Project;
import tn.forma.users.model.ProjectCollaborator;
import tn.forma.users.model.ProjectStatus;
import tn.forma.users.model.ProjectType;
import tn.forma.users.model.User;
import tn.forma.users.repository.ProjectCollaboratorRepository;
import tn.forma.users.repository.ProjectRepository;
import tn.forma.users.repository.UserRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProjectCollaboratorServiceTest {

    @Mock
    private ProjectCollaboratorRepository collaboratorRepository;

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private CollaboratorEmailService collaboratorEmailService;

    @InjectMocks
    private ProjectCollaboratorService projectCollaboratorService;

    @Test
    void getCollaboratorsReturnsMappedDtosIncludingInviteeDetails() {
        User owner = buildUser(5L, "owner@forma.test", "Store", "Owner");
        User invitee = buildUser(8L, "editor@forma.test", "Alex", "Editor");
        Project project = buildProject(owner);
        ProjectCollaborator collaborator = ProjectCollaborator.builder()
                .id(14L)
                .project(project)
                .user(invitee)
                .inviteEmail(invitee.getEmail())
                .role(CollaboratorRole.EDITOR)
                .status(CollaboratorStatus.ACCEPTED)
                .invitedAt(LocalDateTime.of(2026, 4, 18, 10, 0))
                .acceptedAt(LocalDateTime.of(2026, 4, 18, 10, 30))
                .build();

        when(userRepository.findByEmail(owner.getEmail())).thenReturn(Optional.of(owner));
        when(projectRepository.findByIdAndUserId(project.getId(), owner.getId())).thenReturn(Optional.of(project));
        when(collaboratorRepository.findAllByProjectId(project.getId())).thenReturn(List.of(collaborator));

        var result = projectCollaboratorService.getCollaborators(owner.getEmail(), project.getId());

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getProjectId()).isEqualTo(project.getId());
        assertThat(result.get(0).getUserId()).isEqualTo(invitee.getId());
        assertThat(result.get(0).getUserName()).isEqualTo("Alex Editor");
        assertThat(result.get(0).getInvitedAt()).isEqualTo("2026-04-18T10:00");
    }

    @Test
    void inviteCollaboratorPersistsPendingCollaboratorAndSendsInviteEmail() {
        User owner = buildUser(5L, "owner@forma.test", "Store", "Owner");
        Project project = buildProject(owner);
        InviteCollaboratorRequest request = new InviteCollaboratorRequest();
        request.setEmail("viewer@forma.test");
        request.setRole(CollaboratorRole.VIEWER);

        when(userRepository.findByEmail(owner.getEmail())).thenReturn(Optional.of(owner));
        when(projectRepository.findByIdAndUserId(project.getId(), owner.getId())).thenReturn(Optional.of(project));
        when(userRepository.findByEmail("viewer@forma.test")).thenReturn(Optional.empty());
        when(collaboratorRepository.findByProjectIdAndInviteEmail(project.getId(), "viewer@forma.test"))
                .thenReturn(Optional.empty());
        when(collaboratorRepository.save(any(ProjectCollaborator.class))).thenAnswer(invocation -> {
            ProjectCollaborator collaborator = invocation.getArgument(0);
            collaborator.setId(21L);
            collaborator.setInvitedAt(LocalDateTime.of(2026, 4, 18, 11, 0));
            return collaborator;
        });

        var result = projectCollaboratorService.inviteCollaborator(owner.getEmail(), project.getId(), request);

        assertThat(result.getId()).isEqualTo(21L);
        assertThat(result.getInviteEmail()).isEqualTo("viewer@forma.test");
        assertThat(result.getRole()).isEqualTo(CollaboratorRole.VIEWER);
        assertThat(result.getStatus()).isEqualTo(CollaboratorStatus.PENDING);
        verify(collaboratorEmailService).sendCollaboratorInviteEmail(
                eq("viewer@forma.test"),
                eq("Store Owner"),
                eq("Forma Shop"),
                eq("VIEWER"),
                anyString()
        );
    }

    @Test
    void acceptInvitationLinksUserAndMarksInvitationAccepted() {
        User invitee = buildUser(8L, "editor@forma.test", "Alex", "Editor");
        Project project = buildProject(buildUser(5L, "owner@forma.test", "Store", "Owner"));
        ProjectCollaborator pending = ProjectCollaborator.builder()
                .id(14L)
                .project(project)
                .invitationToken("invite-token")
                .invitationTokenExpiry(LocalDateTime.now().plusDays(1))
                .inviteEmail("editor@forma.test")
                .role(CollaboratorRole.EDITOR)
                .status(CollaboratorStatus.PENDING)
                .build();

        when(userRepository.findByEmail(invitee.getEmail())).thenReturn(Optional.of(invitee));
        when(collaboratorRepository.findByInvitationToken("invite-token")).thenReturn(Optional.of(pending));
        when(collaboratorRepository.save(any(ProjectCollaborator.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var result = projectCollaboratorService.acceptInvitation(invitee.getEmail(), "invite-token");

        assertThat(result.getId()).isEqualTo(14L);
        assertThat(pending.getUser()).isEqualTo(invitee);
        assertThat(pending.getStatus()).isEqualTo(CollaboratorStatus.ACCEPTED);
        assertThat(pending.getAcceptedAt()).isNotNull();
        assertThat(pending.getInvitationToken()).isEqualTo("invite-token");
    }

    @Test
    void acceptInvitationRejectsDifferentSignedInEmail() {
        User invitee = buildUser(8L, "other@forma.test", "Alex", "Editor");
        Project project = buildProject(buildUser(5L, "owner@forma.test", "Store", "Owner"));
        ProjectCollaborator pending = ProjectCollaborator.builder()
                .id(14L)
                .project(project)
                .invitationToken("invite-token")
                .invitationTokenExpiry(LocalDateTime.now().plusDays(1))
                .inviteEmail("editor@forma.test")
                .role(CollaboratorRole.EDITOR)
                .status(CollaboratorStatus.PENDING)
                .build();

        when(userRepository.findByEmail(invitee.getEmail())).thenReturn(Optional.of(invitee));
        when(collaboratorRepository.findByInvitationToken("invite-token")).thenReturn(Optional.of(pending));

        assertThatThrownBy(() -> projectCollaboratorService.acceptInvitation(invitee.getEmail(), "invite-token"))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("This invitation was sent to a different email address");
    }

    private User buildUser(Long id, String email, String firstName, String lastName) {
        return User.builder()
                .id(id)
                .email(email)
                .firstName(firstName)
                .lastName(lastName)
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
