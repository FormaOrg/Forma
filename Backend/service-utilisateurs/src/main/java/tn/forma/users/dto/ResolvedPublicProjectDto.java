package tn.forma.users.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import tn.forma.users.model.ProjectType;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResolvedPublicProjectDto {
    private Long projectId;
    private String defaultDomain;
    private ProjectType type;
    private boolean published;
}
