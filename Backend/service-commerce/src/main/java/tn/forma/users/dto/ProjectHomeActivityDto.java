package tn.forma.users.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ProjectHomeActivityDto {
    private String title;
    private String description;
    private String occurredAt;
    private String route;
}
