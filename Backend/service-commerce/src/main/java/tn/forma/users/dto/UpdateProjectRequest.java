package tn.forma.users.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import tn.forma.users.model.ProjectStatus;

@Getter
@Setter
public class UpdateProjectRequest {
    @Size(max = 120, message = "Project name must be 120 characters or fewer")
    private String name;

    @Size(max = 2000, message = "Description must be 2000 characters or fewer")
    private String description;

    @Size(max = 160, message = "Store title must be 160 characters or fewer")
    private String storeTitle;

    @Size(max = 40, message = "Contact phone must be 40 characters or fewer")
    private String contactPhone;

    @Email(message = "Store email must be a valid email address")
    @Size(max = 255, message = "Store email must be 255 characters or fewer")
    private String storeEmail;

    @Size(max = 255, message = "Default domain must be 255 characters or fewer")
    private String defaultDomain;

    @Size(max = 500, message = "Meta description must be 500 characters or fewer")
    private String metaDescription;

    @Size(max = 255, message = "Facebook URL must be 255 characters or fewer")
    private String facebookUrl;

    @Size(max = 255, message = "Instagram URL must be 255 characters or fewer")
    private String instagramUrl;

    @Size(max = 255, message = "TikTok URL must be 255 characters or fewer")
    private String tiktokUrl;

    @Size(max = 255, message = "WhatsApp number must be 255 characters or fewer")
    private String whatsappNumber;

    private ProjectStatus status;
    private Boolean isPublished;
    private Long templateId;
}
