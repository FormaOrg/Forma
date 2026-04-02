package tn.forma.users.dto;

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

    private ProjectStatus status;
    private Boolean isPublished;
    private Long templateId;
}
