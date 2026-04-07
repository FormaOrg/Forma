package tn.forma.users.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import tn.forma.users.dto.FileUploadResponse;
import tn.forma.users.dto.ImportProjectMediaRequest;
import tn.forma.users.dto.ProjectMediaDto;
import tn.forma.users.model.Project;
import tn.forma.users.model.ProjectMedia;
import tn.forma.users.model.ProjectMediaType;
import tn.forma.users.model.User;
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

    @Transactional(readOnly = true)
    public List<ProjectMediaDto> getProjectMedia(String email, Long projectId) {
        Project project = getOwnedProject(email, projectId);
        return projectMediaRepository.findAllByProjectIdOrderByUploadedAtDesc(project.getId())
                .stream()
                .map(this::mapToDto)
                .toList();
    }

    @Transactional
    public ProjectMediaDto uploadProjectMedia(String email, Long projectId, MultipartFile file) {
        Project project = getOwnedProject(email, projectId);
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
        Project project = getOwnedProject(email, projectId);
        String sourceUrl = request.getSourceUrl().trim();
        if (sourceUrl.isEmpty()) {
            throw new RuntimeException("Source URL is required");
        }

        var existing = projectMediaRepository.findFirstByProjectIdAndFileUrl(projectId, sourceUrl);
        if (existing.isPresent()) {
            return mapToDto(existing.get());
        }

        FileUploadResponse upload = fileUploadService.importRemoteMedia(sourceUrl, "forma/media");
        String resolvedFileName = resolveImportedFileName(request.getFileName(), upload.getPublicId(), sourceUrl);

        ProjectMedia saved = projectMediaRepository.save(ProjectMedia.builder()
                .project(project)
                .fileName(resolvedFileName)
                .fileUrl(upload.getUrl())
                .publicId(upload.getPublicId())
                .type(resolveMediaType("image/*", resolvedFileName))
                .fileSize(0L)
                .build());

        log.info("Imported remote media {} for project {}", saved.getId(), projectId);
        return mapToDto(saved);
    }

    @Transactional
    public void deleteProjectMedia(String email, Long projectId, Long mediaId) {
        getOwnedProject(email, projectId);
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
                .orElseThrow(() -> new RuntimeException("User not found"));
        return projectRepository.findByIdAndUserId(projectId, user.getId())
                .orElseThrow(() -> new RuntimeException("Project not found"));
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
