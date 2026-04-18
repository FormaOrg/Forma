package tn.forma.users.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import tn.forma.users.dto.FileUploadResponse;
import tn.forma.users.dto.ImportProjectMediaRequest;
import tn.forma.users.dto.ProjectMediaDto;
import tn.forma.users.model.CollaboratorRole;
import tn.forma.users.model.CollaboratorStatus;
import tn.forma.users.model.Project;
import tn.forma.users.model.ProjectMedia;
import tn.forma.users.model.ProjectMediaType;
import tn.forma.users.model.User;
import tn.forma.users.repository.ProjectCollaboratorRepository;
import tn.forma.users.repository.ProjectMediaRepository;
import tn.forma.users.repository.ProjectRepository;
import tn.forma.users.repository.UserRepository;

import java.util.List;
import java.util.Locale;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProjectMediaService {

    private final ProjectMediaRepository projectMediaRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final FileUploadService fileUploadService;
    private final ProjectCollaboratorRepository collaboratorRepository;

    @Transactional(readOnly = true)
    public List<ProjectMediaDto> getProjectMedia(String email, Long projectId) {
        Project project = getAccessibleProject(email, projectId);
        return projectMediaRepository.findAllByProjectIdOrderByUploadedAtDesc(project.getId())
                .stream()
                .map(this::mapToDto)
                .toList();
    }

    @Transactional
    public ProjectMediaDto uploadProjectMedia(String email, Long projectId, MultipartFile file) {
        Project project = getEditableProject(email, projectId);
        FileUploadResponse upload = fileUploadService.uploadProjectMedia(file);

        ProjectMedia saved = projectMediaRepository.save(ProjectMedia.builder()
                .project(project)
                .fileName(resolveFileName(file.getOriginalFilename(), upload.getPublicId()))
                .fileUrl(upload.getUrl())
                .publicId(upload.getPublicId())
                .type(resolveMediaType(file.getContentType(), file.getOriginalFilename()))
                .fileSize(file.getSize())
                .build());

        log.info("Project media {} uploaded for project {}", saved.getId(), projectId);
        return mapToDto(saved);
    }

    @Transactional
    public ProjectMediaDto importProjectMedia(String email, Long projectId, ImportProjectMediaRequest request) {
        Project project = getEditableProject(email, projectId);
        String sourceUrl = request.getSourceUrl().trim();
        if (sourceUrl.isEmpty()) {
            throw new RuntimeException("Source URL is required");
        }

        var existing = projectMediaRepository.findFirstByProjectIdAndFileUrl(projectId, sourceUrl);
        if (existing.isPresent()) {
            return mapToDto(existing.get());
        }

        FileUploadResponse upload = fileUploadService.importRemoteMedia(sourceUrl, "forma/media");

        ProjectMedia saved = projectMediaRepository.save(ProjectMedia.builder()
                .project(project)
                .fileName(resolveImportedFileName(request.getFileName(), upload.getPublicId(), sourceUrl))
                .fileUrl(upload.getUrl())
                .publicId(upload.getPublicId())
                .type(resolveMediaType("image/*", resolveImportedFileName(request.getFileName(), upload.getPublicId(), sourceUrl)))
                .fileSize(0L)
                .build());

        log.info("Imported remote media {} for project {}", saved.getId(), projectId);
        return mapToDto(saved);
    }

    @Transactional
    public void deleteProjectMedia(String email, Long projectId, Long mediaId) {
        getEditableProject(email, projectId);
        ProjectMedia media = projectMediaRepository.findByIdAndProjectId(mediaId, projectId)
                .orElseThrow(() -> new RuntimeException("Media not found"));

        projectMediaRepository.delete(media);
        if (media.getPublicId() != null && !media.getPublicId().isBlank()) {
            fileUploadService.deleteByPublicId(media.getPublicId());
        } else {
            fileUploadService.deleteFile(media.getFileUrl());
        }
    }

    private ProjectMediaDto mapToDto(ProjectMedia media) {
        return ProjectMediaDto.builder()
                .id(media.getId())
                .projectId(media.getProject().getId())
                .fileName(media.getFileName())
                .fileUrl(media.getFileUrl())
                .type(media.getType())
                .fileSize(Objects.requireNonNullElse(media.getFileSize(), 0L))
                .uploadedAt(Objects.toString(media.getUploadedAt(), null))
                .build();
    }

    private Project getOwnedProject(String email, Long projectId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        return projectRepository.findByIdAndUserId(projectId, user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Project not found or access denied"));
    }

    private Project getAccessibleProject(String email, Long projectId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        return projectRepository.findByIdAndUserId(projectId, user.getId())
                .orElseGet(() -> projectRepository.findById(projectId)
                        .filter(p -> collaboratorRepository
                                .findByProjectIdAndUserIdAndStatus(projectId, user.getId(), CollaboratorStatus.ACCEPTED)
                                .isPresent())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found")));
    }

    private Project getEditableProject(String email, Long projectId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        return projectRepository.findByIdAndUserId(projectId, user.getId())
                .orElseGet(() -> projectRepository.findById(projectId)
                        .filter(p -> collaboratorRepository
                                .findByProjectIdAndUserIdAndStatus(projectId, user.getId(), CollaboratorStatus.ACCEPTED)
                                .filter(collaborator -> collaborator.getRole() == CollaboratorRole.EDITOR)
                                .isPresent())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Project not found or access denied")));
    }

    private String resolveFileName(String originalFilename, String publicId) {
        if (originalFilename != null && !originalFilename.trim().isEmpty()) {
            return originalFilename.trim();
        }
        return resolveImportedFileName(null, publicId, null);
    }

    private String resolveImportedFileName(String requestedName, String publicId, String sourceUrl) {
        if (requestedName != null && !requestedName.trim().isEmpty()) {
            return requestedName.trim();
        }
        if (sourceUrl != null && !sourceUrl.isBlank()) {
            String normalized = sourceUrl.split("\\?")[0];
            int lastSlash = normalized.lastIndexOf('/');
            if (lastSlash >= 0 && lastSlash < normalized.length() - 1) {
                return normalized.substring(lastSlash + 1);
            }
        }
        if (publicId != null && !publicId.isBlank()) {
            int lastSlash = publicId.lastIndexOf('/');
            return lastSlash >= 0 ? publicId.substring(lastSlash + 1) : publicId;
        }
        return "media-file";
    }

    private ProjectMediaType resolveMediaType(String contentType, String fileName) {
        String normalizedContentType = contentType == null ? "" : contentType.toLowerCase(Locale.ROOT);
        if (normalizedContentType.startsWith("image/")) {
            return ProjectMediaType.IMAGE;
        }
        if (normalizedContentType.startsWith("video/")) {
            return ProjectMediaType.VIDEO;
        }

        String normalizedFileName = fileName == null ? "" : fileName.toLowerCase(Locale.ROOT);
        if (normalizedFileName.matches(".*\\.(png|jpe?g|gif|webp|avif|svg)$")) {
            return ProjectMediaType.IMAGE;
        }
        if (normalizedFileName.matches(".*\\.(mp4|webm|mov|avi|mkv)$")) {
            return ProjectMediaType.VIDEO;
        }
        return ProjectMediaType.DOCUMENT;
    }
}
