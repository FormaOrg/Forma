package tn.forma.users.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import tn.forma.users.model.CreationMethod;
import tn.forma.users.model.ProjectType;

@Getter
@Setter
public class CreateProjectRequest {
    @NotBlank(message = "Project name is required")
    @Size(max = 120, message = "Project name must be 120 characters or fewer")
    private String name;

    @Size(max = 2000, message = "Description must be 2000 characters or fewer")
    private String description;

    @NotNull(message = "Project type is required")
    private ProjectType type;

    @NotNull(message = "Creation method is required")
    private CreationMethod creationMethod;

    private Long templateId;
}
