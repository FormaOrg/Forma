package tn.forma.users.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ProjectHomeActionDto {
    private String title;
    private String description;
    private String route;
    private String actionLabel;
}
