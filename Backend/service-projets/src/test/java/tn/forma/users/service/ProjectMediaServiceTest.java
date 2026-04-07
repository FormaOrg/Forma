package tn.forma.users.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import tn.forma.users.dto.FileUploadResponse;
import tn.forma.users.dto.ImportProjectMediaRequest;
import tn.forma.users.model.CreationMethod;
import tn.forma.users.model.Project;
import tn.forma.users.model.ProjectMedia;
import tn.forma.users.model.ProjectMediaType;
import tn.forma.users.model.ProjectStatus;
import tn.forma.users.model.ProjectType;
import tn.forma.users.model.User;
import tn.forma.users.repository.ProjectMediaRepository;
import tn.forma.users.repository.ProjectRepository;
import tn.forma.users.repository.UserRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProjectMediaServiceTest {

    @Mock
    private ProjectMediaRepository projectMediaRepository;

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private FileUploadService fileUploadService;

    @InjectMocks
    private ProjectMediaService projectMediaService;

    @Test
    void getProjectMediaReturnsOrderedMappedDtos() {
        User user = buildUser();
        Project project = buildProject(user);
        ProjectMedia newer = buildMedia(11L, project, "hero.jpg", "https://cdn.example.com/hero.jpg", "forma/media/hero", LocalDateTime.now());
        ProjectMedia older = buildMedia(9L, project, "catalog.pdf", "https://cdn.example.com/catalog.pdf", "forma/media/catalog", LocalDateTime.now().minusDays(1));

        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(projectRepository.findByIdAndUserId(project.getId(), user.getId())).thenReturn(Optional.of(project));
        when(projectMediaRepository.findAllByProjectIdOrderByUploadedAtDesc(project.getId())).thenReturn(List.of(newer, older));

        var result = projectMediaService.getProjectMedia(user.getEmail(), project.getId());

        assertThat(result).hasSize(2);
        assertThat(result.get(0).getId()).isEqualTo(11L);
        assertThat(result.get(0).getFileName()).isEqualTo("hero.jpg");
        assertThat(result.get(1).getType()).isEqualTo(ProjectMediaType.DOCUMENT);
    }

    @Test
    void uploadProjectMediaPersistsUploadedAssetMetadata() {
        User user = buildUser();
        Project project = buildProject(user);
        MockMultipartFile file = new MockMultipartFile("file", "header image.PNG", "image/png", new byte[]{1, 2, 3});

        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(projectRepository.findByIdAndUserId(project.getId(), user.getId())).thenReturn(Optional.of(project));
        when(fileUploadService.uploadProjectMedia(file)).thenReturn(FileUploadResponse.builder()
                .url("https://res.cloudinary.com/demo/image/upload/v1/forma/media/header-image.png")
                .publicId("forma/media/header-image")
                .build());
        when(projectMediaRepository.save(any(ProjectMedia.class))).thenAnswer(invocation -> {
            ProjectMedia media = invocation.getArgument(0);
            media.setId(41L);
            media.setUploadedAt(LocalDateTime.of(2026, 4, 8, 1, 0));
            return media;
        });

        var result = projectMediaService.uploadProjectMedia(user.getEmail(), project.getId(), file);

        ArgumentCaptor<ProjectMedia> captor = ArgumentCaptor.forClass(ProjectMedia.class);
        verify(projectMediaRepository).save(captor.capture());
        ProjectMedia persisted = captor.getValue();
        assertThat(persisted.getProject()).isEqualTo(project);
        assertThat(persisted.getFileName()).isEqualTo("header image.PNG");
        assertThat(persisted.getType()).isEqualTo(ProjectMediaType.IMAGE);
        assertThat(persisted.getFileSize()).isEqualTo(3L);

        assertThat(result.getId()).isEqualTo(41L);
        assertThat(result.getFileUrl()).contains("cloudinary");
    }

    @Test
    void importProjectMediaReturnsExistingRecordForDuplicateSourceUrl() {
        User user = buildUser();
        Project project = buildProject(user);
        ProjectMedia existing = buildMedia(77L, project, "pexels.jpg", "https://images.pexels.com/photos/123/pexels-photo.jpeg", null, LocalDateTime.now());
        ImportProjectMediaRequest request = new ImportProjectMediaRequest();
        request.setSourceUrl("https://images.pexels.com/photos/123/pexels-photo.jpeg");
        request.setFileName("pexels-photo.jpeg");

        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(projectRepository.findByIdAndUserId(project.getId(), user.getId())).thenReturn(Optional.of(project));
        when(projectMediaRepository.findFirstByProjectIdAndFileUrl(project.getId(), request.getSourceUrl()))
                .thenReturn(Optional.of(existing));

        var result = projectMediaService.importProjectMedia(user.getEmail(), project.getId(), request);

        verify(fileUploadService, never()).importRemoteMedia(any(), any());
        verify(projectMediaRepository, never()).save(any());
        assertThat(result.getId()).isEqualTo(77L);
        assertThat(result.getFileUrl()).isEqualTo(request.getSourceUrl());
    }

    @Test
    void importProjectMediaUploadsAndPersistsRemoteAssetWhenNew() {
        User user = buildUser();
        Project project = buildProject(user);
        ImportProjectMediaRequest request = new ImportProjectMediaRequest();
        request.setSourceUrl("https://images.pexels.com/photos/123/pexels-photo.jpeg?auto=compress");
        request.setFileName("pexels-photo.jpeg");

        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(projectRepository.findByIdAndUserId(project.getId(), user.getId())).thenReturn(Optional.of(project));
        when(projectMediaRepository.findFirstByProjectIdAndFileUrl(project.getId(), request.getSourceUrl()))
                .thenReturn(Optional.empty());
        when(fileUploadService.importRemoteMedia(request.getSourceUrl(), "forma/media"))
                .thenReturn(FileUploadResponse.builder()
                        .url("https://res.cloudinary.com/demo/image/upload/v1/forma/media/pexels-photo.jpeg")
                        .publicId("forma/media/pexels-photo")
                        .build());
        when(projectMediaRepository.save(any(ProjectMedia.class))).thenAnswer(invocation -> {
            ProjectMedia media = invocation.getArgument(0);
            media.setId(101L);
            media.setUploadedAt(LocalDateTime.of(2026, 4, 8, 1, 15));
            return media;
        });

        var result = projectMediaService.importProjectMedia(user.getEmail(), project.getId(), request);

        assertThat(result.getId()).isEqualTo(101L);
        assertThat(result.getFileName()).isEqualTo("pexels-photo.jpeg");
        assertThat(result.getType()).isEqualTo(ProjectMediaType.IMAGE);
    }

    @Test
    void importProjectMediaRejectsBlankSourceUrl() {
        User user = buildUser();
        Project project = buildProject(user);
        ImportProjectMediaRequest request = new ImportProjectMediaRequest();
        request.setSourceUrl("   ");

        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(projectRepository.findByIdAndUserId(project.getId(), user.getId())).thenReturn(Optional.of(project));

        assertThatThrownBy(() -> projectMediaService.importProjectMedia(user.getEmail(), project.getId(), request))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Source URL is required");
    }

    @Test
    void deleteProjectMediaDeletesDatabaseRecordAndCloudinaryAsset() {
        User user = buildUser();
        Project project = buildProject(user);
        ProjectMedia media = buildMedia(56L, project, "hero.jpg", "https://cdn.example.com/hero.jpg", "forma/media/hero", LocalDateTime.now());

        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(projectRepository.findByIdAndUserId(project.getId(), user.getId())).thenReturn(Optional.of(project));
        when(projectMediaRepository.findByIdAndProjectId(media.getId(), project.getId())).thenReturn(Optional.of(media));

        projectMediaService.deleteProjectMedia(user.getEmail(), project.getId(), media.getId());

        verify(projectMediaRepository).delete(media);
        verify(fileUploadService).deleteByPublicId("forma/media/hero");
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

    private ProjectMedia buildMedia(Long id, Project project, String fileName, String fileUrl, String publicId, LocalDateTime uploadedAt) {
        return ProjectMedia.builder()
                .id(id)
                .project(project)
                .fileName(fileName)
                .fileUrl(fileUrl)
                .publicId(publicId)
                .type(fileName.endsWith(".pdf") ? ProjectMediaType.DOCUMENT : ProjectMediaType.IMAGE)
                .fileSize(1024L)
                .uploadedAt(uploadedAt)
                .build();
    }
}
