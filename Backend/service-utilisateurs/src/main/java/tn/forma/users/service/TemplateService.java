package tn.forma.users.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.forma.users.dto.TemplateDto;
import tn.forma.users.model.Template;
import tn.forma.users.model.User;
import tn.forma.users.repository.TemplateRepository;
import tn.forma.users.repository.UserRepository;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class TemplateService {

    private final TemplateRepository templateRepository;
    private final UserRepository userRepository;

    public List<TemplateDto> getTemplates(String email) {
        User user = getUserByEmail(email);
        return templateRepository.findAllByOwnerIsNullOrOwnerIdOrderByFeaturedDescUpdatedAtDesc(user.getId())
                .stream()
                .map(template -> mapToDto(template, user.getId()))
                .toList();
    }

    public Template getAccessibleTemplate(String email, Long templateId) {
        User user = getUserByEmail(email);
        Template template = templateRepository.findById(templateId)
                .orElseThrow(() -> new RuntimeException("Template not found"));

        if (template.getOwner() != null && !Objects.equals(template.getOwner().getId(), user.getId())) {
            throw new RuntimeException("Template not found");
        }

        return template;
    }

    private TemplateDto mapToDto(Template template, Long currentUserId) {
        boolean isOwned = template.getOwner() != null && Objects.equals(template.getOwner().getId(), currentUserId);

        return TemplateDto.builder()
                .id(template.getId())
                .name(template.getName())
                .description(template.getDescription())
                .category(template.getCategory())
                .projectType(template.getProjectType())
                .creationMethod(template.getCreationMethod())
                .previewImageUrl(template.getPreviewImageUrl())
                .previewUrl(template.getPreviewUrl())
                .previewRoute(template.getPreviewRoute())
                .featured(template.isFeatured())
                .isOwned(isOwned)
                .premium(template.isPremium())
                .tags(parseTags(template.getTagsCsv(), template.getCategory()))
                .usesCount(template.getUsesCount())
                .createdAt(Objects.toString(template.getCreatedAt(), null))
                .updatedAt(Objects.toString(template.getUpdatedAt(), null))
                .build();
    }

    private List<String> parseTags(String tagsCsv, String category) {
        if (tagsCsv == null || tagsCsv.isBlank()) {
            return category == null || category.isBlank()
                    ? Collections.emptyList()
                    : List.of(category);
        }

        return Arrays.stream(tagsCsv.split(","))
                .map(String::trim)
                .filter(value -> !value.isEmpty())
                .distinct()
                .toList();
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
