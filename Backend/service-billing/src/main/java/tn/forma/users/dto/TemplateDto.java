package tn.forma.users.dto;

import lombok.Builder;
import lombok.Getter;
import tn.forma.users.model.CreationMethod;
import tn.forma.users.model.ProjectType;

import java.util.List;

@Getter
@Builder
public class TemplateDto {
    private Long id;
    private String name;
    private String description;
    private String category;
    private ProjectType projectType;
    private CreationMethod creationMethod;
    private String previewImageUrl;
    private String previewUrl;
    private String previewRoute;
    private boolean featured;
    private boolean isOwned;
    private boolean premium;
    private List<String> tags;
    private long usesCount;
    private String createdAt;
    private String updatedAt;
}
