package tn.forma.users.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import tn.forma.users.dto.ProjectStorefrontDto;
import tn.forma.users.dto.PublishProjectStorefrontResponse;
import tn.forma.users.dto.UpdateProjectStorefrontRequest;
import tn.forma.users.model.CollaboratorStatus;
import tn.forma.users.model.Project;
import tn.forma.users.model.ProjectStatus;
import tn.forma.users.model.ProjectStorefront;
import tn.forma.users.model.ProjectType;
import tn.forma.users.model.StorefrontStatus;
import tn.forma.users.model.User;
import tn.forma.users.repository.ProjectCollaboratorRepository;
import tn.forma.users.repository.ProjectRepository;
import tn.forma.users.repository.ProjectStorefrontRepository;
import tn.forma.users.repository.UserRepository;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class ProjectStorefrontService {

    private static final String DEFAULT_THEME_KEY = "commerce-minimal";
    private static final String DEFAULT_PAGE_KEY = "home";
    private static final String ACTIVE_EDITORS_FIELD = "activeEditors";
    private static final long ACTIVE_EDITOR_TTL_SECONDS = 45;

    private final ProjectStorefrontRepository projectStorefrontRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final ProjectCollaboratorRepository collaboratorRepository;
    private final ObjectMapper objectMapper;

    public ProjectStorefrontDto getStorefront(String email, Long projectId) {
        ProjectStorefront storefront = getOrCreateAccessibleStorefront(email, projectId);
        return mapToDto(storefront, sanitizeEditorSession(storefront.getEditorSessionJson()));
    }

    @Transactional
    public ProjectStorefrontDto updateStorefront(String email, Long projectId, UpdateProjectStorefrontRequest request) {
        ProjectStorefront storefront = getOrCreateEditableStorefront(email, projectId);
        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

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
            storefront.setDraftHomepageJson(objectMapper.valueToTree(request.getDraftHomepage()));
        }

        if (request.getEditorSession() != null) {
            storefront.setEditorSessionJson(mergeEditorSession(
                    storefront.getEditorSessionJson(),
                    objectMapper.valueToTree(request.getEditorSession()),
                    currentUser
            ));
        }

        ProjectStorefront savedStorefront = projectStorefrontRepository.save(storefront);
        return mapToDto(savedStorefront, sanitizeEditorSession(savedStorefront.getEditorSessionJson()));
    }

    @Transactional
    public PublishProjectStorefrontResponse publishStorefront(String email, Long projectId) {
        ProjectStorefront storefront = getOrCreateEditableStorefront(email, projectId);
        storefront.setPublishedHomepageJson(storefront.getDraftHomepageJson() != null
                ? storefront.getDraftHomepageJson().deepCopy()
                : null);
        storefront.setStoreStatus(StorefrontStatus.PUBLISHED);
        storefront.setPublishedAt(LocalDateTime.now());
        storefront.setEditorSessionJson(resetEditorSession(storefront.getEditorSessionJson()));
        storefront.getProject().setPublished(true);
        storefront.getProject().setStatus(ProjectStatus.PUBLISHED);

        ProjectStorefront savedStorefront = projectStorefrontRepository.save(storefront);
        return PublishProjectStorefrontResponse.builder()
                .storefront(mapToDto(savedStorefront))
                .publishedAt(Objects.toString(savedStorefront.getPublishedAt(), null))
                .build();
    }

    @Transactional
    public ProjectStorefrontDto unpublishStorefront(String email, Long projectId) {
        ProjectStorefront storefront = getOrCreateEditableStorefront(email, projectId);
        storefront.setStoreStatus(StorefrontStatus.DRAFT);
        storefront.setPublishedHomepageJson(null);
        storefront.setPublishedAt(null);
        storefront.getProject().setPublished(false);
        storefront.getProject().setStatus(ProjectStatus.DRAFT);
        return mapToDto(projectStorefrontRepository.save(storefront));
    }

    private ProjectStorefront getOrCreateOwnedStorefront(String email, Long projectId) {
        Project project = getOwnedProject(email, projectId);
        ensureEcommerceProject(project);

        return projectStorefrontRepository.findByProjectId(project.getId())
                .orElseGet(() -> projectStorefrontRepository.save(buildDefaultStorefront(project)));
    }

    private ProjectStorefront getOrCreateAccessibleStorefront(String email, Long projectId) {
        Project project = getAccessibleProject(email, projectId);
        ensureEcommerceProject(project);

        return projectStorefrontRepository.findByProjectId(project.getId())
                .orElseGet(() -> projectStorefrontRepository.save(buildDefaultStorefront(project)));
    }

    private ProjectStorefront getOrCreateEditableStorefront(String email, Long projectId) {
        Project project = getEditableProject(email, projectId);
        ensureEcommerceProject(project);

        return projectStorefrontRepository.findByProjectId(project.getId())
                .orElseGet(() -> projectStorefrontRepository.save(buildDefaultStorefront(project)));
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
                        .filter(project -> collaboratorRepository
                                .findByProjectIdAndUserIdAndStatus(projectId, user.getId(), CollaboratorStatus.ACCEPTED)
                                .isPresent())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found")));
    }

    private Project getEditableProject(String email, Long projectId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        return projectRepository.findByIdAndUserId(projectId, user.getId())
                .orElseGet(() -> projectRepository.findById(projectId)
                        .filter(project -> collaboratorRepository
                                .findByProjectIdAndUserIdAndStatus(projectId, user.getId(), CollaboratorStatus.ACCEPTED)
                                .filter(collaborator -> collaborator.getRole() == tn.forma.users.model.CollaboratorRole.EDITOR)
                                .isPresent())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Project not found or access denied")));
    }

    private void ensureEcommerceProject(Project project) {
        if (project.getType() != ProjectType.ECOMMERCE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Storefront editing is only available for ecommerce projects");
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
                .editorSessionJson(buildDefaultEditorSession())
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

    private ObjectNode buildDefaultEditorSession() {
        ObjectNode session = objectMapper.createObjectNode();
        session.putNull("selectedSectionId");
        session.put("viewport", "desktop");
        session.put("zoomPercent", 120);
        session.set("undoStack", objectMapper.createArrayNode());
        session.set("redoStack", objectMapper.createArrayNode());
        session.set(ACTIVE_EDITORS_FIELD, objectMapper.createArrayNode());
        return session;
    }

    private JsonNode resetEditorSession(JsonNode editorSession) {
        ObjectNode session = editorSession != null && editorSession.isObject()
                ? editorSession.deepCopy()
                : buildDefaultEditorSession();
        session.set("undoStack", objectMapper.createArrayNode());
        session.set("redoStack", objectMapper.createArrayNode());
        return session;
    }

    private ProjectStorefrontDto mapToDto(ProjectStorefront storefront) {
        return mapToDto(storefront, storefront.getEditorSessionJson());
    }

    private ProjectStorefrontDto mapToDto(ProjectStorefront storefront, JsonNode editorSession) {
        return ProjectStorefrontDto.builder()
                .id(storefront.getId())
                .projectId(storefront.getProject().getId())
                .storeName(storefront.getStoreName())
                .storeStatus(storefront.getStoreStatus().name())
                .themeKey(storefront.getThemeKey())
                .activePageKey(storefront.getActivePageKey())
                .draftHomepage(toPlainJson(storefront.getDraftHomepageJson()))
                .publishedHomepage(toPlainJson(storefront.getPublishedHomepageJson()))
                .editorSession(toPlainJson(editorSession))
                .publishedAt(Objects.toString(storefront.getPublishedAt(), null))
                .createdAt(Objects.toString(storefront.getCreatedAt(), null))
                .updatedAt(Objects.toString(storefront.getUpdatedAt(), null))
                .build();
    }

    private JsonNode mergeEditorSession(JsonNode existingEditorSession, JsonNode incomingEditorSession, User currentUser) {
        ObjectNode merged = existingEditorSession != null && existingEditorSession.isObject()
                ? existingEditorSession.deepCopy()
                : buildDefaultEditorSession();

        if (incomingEditorSession != null && incomingEditorSession.isObject()) {
            Iterator<Map.Entry<String, JsonNode>> fields = incomingEditorSession.fields();
            while (fields.hasNext()) {
                Map.Entry<String, JsonNode> field = fields.next();
                if (!ACTIVE_EDITORS_FIELD.equals(field.getKey())) {
                    merged.set(field.getKey(), field.getValue().deepCopy());
                }
            }
        }

        merged.set(
                ACTIVE_EDITORS_FIELD,
                mergeActiveEditors(
                        existingEditorSession,
                        incomingEditorSession,
                        currentUser
                )
        );
        return merged;
    }

    private JsonNode sanitizeEditorSession(JsonNode editorSession) {
        ObjectNode sanitized = editorSession != null && editorSession.isObject()
                ? editorSession.deepCopy()
                : buildDefaultEditorSession();
        sanitized.set(ACTIVE_EDITORS_FIELD, mergeActiveEditors(editorSession, null, null));
        return sanitized;
    }

    private ArrayNode mergeActiveEditors(JsonNode existingEditorSession, JsonNode incomingEditorSession, User currentUser) {
        Map<String, ObjectNode> mergedEditors = new LinkedHashMap<>();
        collectActiveEditors(mergedEditors, existingEditorSession);
        collectActiveEditors(mergedEditors, incomingEditorSession);

        if (currentUser != null) {
            ObjectNode currentEditor = objectMapper.createObjectNode();
            currentEditor.put("userId", currentUser.getId());
            currentEditor.put("email", currentUser.getEmail());
            currentEditor.put("userName", buildUserDisplayName(currentUser));
            if (blankToNull(currentUser.getAvatarUrl()) != null) {
                currentEditor.put("avatarUrl", currentUser.getAvatarUrl());
            } else {
                currentEditor.putNull("avatarUrl");
            }
            currentEditor.put("lastSeenAt", Instant.now().toString());
            mergedEditors.put(resolveActiveEditorKey(currentEditor), currentEditor);
        }

        Instant cutoff = Instant.now().minusSeconds(ACTIVE_EDITOR_TTL_SECONDS);
        ArrayNode activeEditors = objectMapper.createArrayNode();
        for (ObjectNode editor : mergedEditors.values()) {
            if (isActiveEditorFresh(editor, cutoff)) {
                activeEditors.add(editor);
            }
        }
        return activeEditors;
    }

    private void collectActiveEditors(Map<String, ObjectNode> target, JsonNode editorSession) {
        if (editorSession == null || !editorSession.isObject()) {
            return;
        }

        JsonNode activeEditors = editorSession.get(ACTIVE_EDITORS_FIELD);
        if (activeEditors == null || !activeEditors.isArray()) {
            return;
        }

        for (JsonNode node : activeEditors) {
            if (!node.isObject()) {
                continue;
            }

            ObjectNode activeEditor = ((ObjectNode) node).deepCopy();
            target.put(resolveActiveEditorKey(activeEditor), activeEditor);
        }
    }

    private String resolveActiveEditorKey(JsonNode activeEditor) {
        if (activeEditor.hasNonNull("userId")) {
            return "user:" + activeEditor.get("userId").asText();
        }
        if (activeEditor.hasNonNull("email")) {
            return "email:" + activeEditor.get("email").asText("").trim().toLowerCase();
        }
        return "name:" + activeEditor.path("userName").asText("unknown");
    }

    private boolean isActiveEditorFresh(JsonNode activeEditor, Instant cutoff) {
        String lastSeenAt = activeEditor.path("lastSeenAt").asText(null);
        if (lastSeenAt == null || lastSeenAt.isBlank()) {
            return false;
        }

        try {
            return !Instant.parse(lastSeenAt).isBefore(cutoff);
        } catch (DateTimeParseException ignored) {
            return false;
        }
    }

    private String buildUserDisplayName(User user) {
        String firstName = blankToNull(user.getFirstName());
        String lastName = blankToNull(user.getLastName());
        String fullName = Stream.of(firstName, lastName)
                .filter(Objects::nonNull)
                .reduce((left, right) -> left + " " + right)
                .orElse(null);
        if (fullName != null) {
            return fullName;
        }

        return blankToNull(user.getEmail()) != null ? user.getEmail() : "Forma user";
    }

    private Object toPlainJson(JsonNode node) {
        return node != null ? objectMapper.convertValue(node, Object.class) : null;
    }

    private String blankToNull(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
