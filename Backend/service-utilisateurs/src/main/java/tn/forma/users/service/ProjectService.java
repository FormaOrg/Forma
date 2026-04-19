package tn.forma.users.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.forma.users.dto.CreateProjectRequest;
import tn.forma.users.dto.ProjectDto;
import tn.forma.users.dto.UpdateProjectRequest;
import tn.forma.users.model.Project;
import tn.forma.users.model.ProjectStatus;
import tn.forma.users.model.Template;
import tn.forma.users.model.User;
import tn.forma.users.repository.ProjectRepository;
import tn.forma.users.repository.UserRepository;
import tn.forma.users.util.ProjectDomainNormalizer;

import java.util.Comparator;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final TemplateService templateService;
    private final FileUploadService fileUploadService;
    private final PortfolioPageService portfolioPageService;
    private final PortfolioInquiryService portfolioInquiryService;
    private final ProjectCollaboratorService projectCollaboratorService;
    private final ProjectAccessService projectAccessService;

    @Transactional(readOnly = true)
    public List<ProjectDto> getMyProjects(String email) {
        User user = getUserByEmail(email);
        return mergeOwnedAndCollaboratorProjects(user)
                .stream()
                .map(this::mapToDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public ProjectDto getProjectById(String email, Long projectId) {
        return mapToDto(getAccessibleProject(email, projectId));
    }

    @Transactional(readOnly = true)
    public void ensureProjectOwnership(String email, Long projectId) {
        getOwnedProject(email, projectId);
    }

    @Transactional(readOnly = true)
    public void ensureProjectEditableAccess(String email, Long projectId) {
        getEditableProject(email, projectId);
    }

    @Transactional
    public ProjectDto createProject(String email, CreateProjectRequest request) {
        User user = getUserByEmail(email);
        Template template = resolveTemplate(email, request.getTemplateId());

        Project project = Project.builder()
                .user(user)
                .templateId(template != null ? template.getId() : request.getTemplateId())
                .name(resolveProjectName(request, template))
                .description(resolveProjectDescription(request, template))
                .type(template != null ? template.getProjectType() : request.getType())
                .creationMethod(template != null ? template.getCreationMethod() : request.getCreationMethod())
                .status(ProjectStatus.DRAFT)
                .published(false)
                .build();

        Project savedProject = projectRepository.save(project);
        if (template != null) {
            template.setUsesCount(template.getUsesCount() + 1);
        }
        log.info("Project {} created for {}", savedProject.getId(), email);
        return mapToDto(savedProject);
    }

    @Transactional
    public ProjectDto updateProject(String email, Long projectId, UpdateProjectRequest request) {
        Project project = getOwnedProject(email, projectId);

        if (request.getName() != null) {
            String trimmedName = blankToNull(request.getName());
            if (trimmedName == null) {
                throw new RuntimeException("Project name is required");
            }
            project.setName(trimmedName);
        }

        if (request.getDescription() != null) {
            project.setDescription(blankToNull(request.getDescription()));
        }

        if (request.getStoreTitle() != null) {
            project.setStoreTitle(blankToNull(request.getStoreTitle()));
        }

        if (request.getContactPhone() != null) {
            project.setContactPhone(blankToNull(request.getContactPhone()));
        }

        if (request.getStoreEmail() != null) {
            project.setStoreEmail(blankToNull(request.getStoreEmail()));
        }

        if (request.getDefaultDomain() != null) {
            project.setDefaultDomain(normalizeProjectDomain(request.getDefaultDomain()));
        }

        if (request.getMetaDescription() != null) {
            project.setMetaDescription(blankToNull(request.getMetaDescription()));
        }

        if (request.getFacebookUrl() != null) {
            project.setFacebookUrl(blankToNull(request.getFacebookUrl()));
        }

        if (request.getInstagramUrl() != null) {
            project.setInstagramUrl(blankToNull(request.getInstagramUrl()));
        }

        if (request.getTiktokUrl() != null) {
            project.setTiktokUrl(blankToNull(request.getTiktokUrl()));
        }

        if (request.getWhatsappNumber() != null) {
            project.setWhatsappNumber(blankToNull(request.getWhatsappNumber()));
        }

        if (request.getTemplateId() != null) {
            project.setTemplateId(request.getTemplateId());
        }

        if (request.getStatus() != null) {
            project.setStatus(request.getStatus());
            project.setPublished(request.getStatus() == ProjectStatus.PUBLISHED);
        } else if (request.getIsPublished() != null) {
            project.setPublished(request.getIsPublished());
            if (Boolean.TRUE.equals(request.getIsPublished()) && project.getStatus() != ProjectStatus.PUBLISHED) {
                project.setStatus(ProjectStatus.PUBLISHED);
            }
            if (Boolean.FALSE.equals(request.getIsPublished()) && project.getStatus() == ProjectStatus.PUBLISHED) {
                project.setStatus(ProjectStatus.DRAFT);
            }
        }

        Project savedProject = projectRepository.save(project);
        return mapToDto(savedProject);
    }

    @Transactional
    public void deleteProject(String email, Long projectId) {
        Project project = getOwnedProject(email, projectId);
        String logoPublicId = blankToNull(project.getLogoPublicId());
        projectCollaboratorService.deleteAllForProject(projectId);
        portfolioPageService.deletePagesForProject(projectId);
        portfolioInquiryService.deleteInquiriesForProject(projectId);
        projectRepository.delete(project);
        if (logoPublicId != null) {
            fileUploadService.deleteByPublicId(logoPublicId);
        }
        log.info("Project {} deleted for {}", projectId, email);
    }

    @Transactional
    public ProjectDto duplicateProject(String email, Long projectId) {
        Project source = getOwnedProject(email, projectId);
        Project duplicate = Project.builder()
                .user(source.getUser())
                .templateId(source.getTemplateId())
                .name(buildDuplicateName(source.getName(), source.getUser().getId()))
                .description(source.getDescription())
                .type(source.getType())
                .creationMethod(source.getCreationMethod())
                .status(ProjectStatus.DRAFT)
                .published(false)
                .build();

        return mapToDto(projectRepository.save(duplicate));
    }

    @Transactional
    public ProjectDto publishProject(String email, Long projectId) {
        Project project = getOwnedProject(email, projectId);
        project.setStatus(ProjectStatus.PUBLISHED);
        project.setPublished(true);
        return mapToDto(projectRepository.save(project));
    }

    @Transactional
    public void updateProjectLogo(String email, Long projectId, String logoUrl, String logoPublicId) {
        Project project = getOwnedProject(email, projectId);
        project.setLogoUrl(blankToNull(logoUrl));
        project.setLogoPublicId(blankToNull(logoPublicId));
        projectRepository.save(project);
    }

    public String getProjectLogoPublicId(String email, Long projectId) {
        Project project = getOwnedProject(email, projectId);
        return blankToNull(project.getLogoPublicId());
    }

    @Transactional
    public String clearProjectLogo(String email, Long projectId) {
        Project project = getOwnedProject(email, projectId);
        String logoPublicId = blankToNull(project.getLogoPublicId());
        project.setLogoUrl(null);
        project.setLogoPublicId(null);
        projectRepository.save(project);
        return logoPublicId;
    }

    private User getUserByEmail(String email) {
        return projectAccessService.getRequiredUser(email);
    }

    private Project getOwnedProject(String email, Long projectId) {
        return projectAccessService.getOwnedProject(email, projectId);
    }

    private Project getAccessibleProject(String email, Long projectId) {
        return projectAccessService.getAccessibleProject(email, projectId);
    }

    private Project getEditableProject(String email, Long projectId) {
        return projectAccessService.getEditableProject(email, projectId);
    }

    private ProjectDto mapToDto(Project project) {
        return ProjectDto.builder()
                .id(project.getId())
                .ownerId(project.getUser().getId())
                .templateId(project.getTemplateId())
                .name(project.getName())
                .description(project.getDescription())
                .storeTitle(project.getStoreTitle())
                .contactPhone(project.getContactPhone())
                .storeEmail(project.getStoreEmail())
                .defaultDomain(project.getDefaultDomain())
                .metaDescription(project.getMetaDescription())
                .logoUrl(project.getLogoUrl())
                .facebookUrl(project.getFacebookUrl())
                .instagramUrl(project.getInstagramUrl())
                .tiktokUrl(project.getTiktokUrl())
                .whatsappNumber(project.getWhatsappNumber())
                .type(project.getType())
                .creationMethod(project.getCreationMethod())
                .status(project.getStatus())
                .published(project.isPublished())
                .createdAt(Objects.toString(project.getCreatedAt(), null))
                .updatedAt(Objects.toString(project.getUpdatedAt(), null))
                .build();
    }

    private String blankToNull(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String normalizeProjectDomain(String value) {
        String normalized = ProjectDomainNormalizer.normalize(value);
        if (normalized != null) {
            return normalized;
        }

        if (value == null || value.trim().isEmpty()) {
            return null;
        }

        throw new RuntimeException("Default domain must be a valid host name");
    }

    private List<Project> mergeOwnedAndCollaboratorProjects(User user) {
        return java.util.stream.Stream.concat(
                        projectRepository.findAllByUserIdOrderByUpdatedAtDesc(user.getId()).stream(),
                        projectCollaboratorService.getAcceptedCollaboratorProjects(user).stream()
                )
                .collect(java.util.stream.Collectors.toMap(
                        Project::getId,
                        project -> project,
                        (left, right) -> left
                ))
                .values()
                .stream()
                .sorted(Comparator.comparing(Project::getUpdatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                .toList();
    }

    private String buildDuplicateName(String sourceName, Long userId) {
        String baseName = sourceName == null || sourceName.isBlank() ? "Untitled project" : sourceName.trim();
        List<String> existingNames = projectRepository.findAllByUserIdOrderByUpdatedAtDesc(userId)
                .stream()
                .map(Project::getName)
                .toList();

        String candidate = baseName + " Copy";
        int suffix = 2;
        while (containsIgnoreCase(existingNames, candidate)) {
            candidate = baseName + " Copy " + suffix;
            suffix += 1;
        }

        return candidate;
    }

    private boolean containsIgnoreCase(List<String> values, String target) {
        for (String value : values) {
            if (value != null && value.equalsIgnoreCase(target)) {
                return true;
            }
        }

        return false;
    }

    private Template resolveTemplate(String email, Long templateId) {
        if (templateId == null) {
            return null;
        }

        return templateService.getAccessibleTemplate(email, templateId);
    }

    private String resolveProjectName(CreateProjectRequest request, Template template) {
        if (template != null && (request.getName() == null || request.getName().trim().isEmpty())) {
            return template.getName();
        }

        return request.getName().trim();
    }

    private String resolveProjectDescription(CreateProjectRequest request, Template template) {
        String manualDescription = blankToNull(request.getDescription());
        if (manualDescription != null) {
            return manualDescription;
        }

        return template != null ? blankToNull(template.getDescription()) : null;
    }
}
