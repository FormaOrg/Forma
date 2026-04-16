package tn.forma.users.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import tn.forma.users.model.CreationMethod;
import tn.forma.users.model.ProjectStatus;
import tn.forma.users.model.ProjectType;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectDto {
    private Long id;
    private Long ownerId;
    private Long templateId;
    private String name;
    private String description;
    private String storeTitle;
    private String contactPhone;
    private String storeEmail;
    private String defaultDomain;
    private String metaDescription;
    private String logoUrl;
    private String facebookUrl;
    private String instagramUrl;
    private String tiktokUrl;
    private String whatsappNumber;
    private ProjectType type;
    private CreationMethod creationMethod;
    private ProjectStatus status;

    @JsonProperty("isPublished")
    private boolean published;

    private String createdAt;
    private String updatedAt;
}
