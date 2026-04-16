package tn.forma.users.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class ProjectHomePageDto {
    private Long projectId;
    private String projectName;
    private String ownerName;
    private String projectStatus;
    private boolean published;
    private String projectType;
    private String creationMethod;
    private List<ProjectHomeMetricDto> metrics;
    private List<ProjectHomeActivityDto> recentActivities;
    private List<ProjectHomeActionDto> suggestedActions;
}
