package tn.forma.users.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ProjectHomeMetricDto {
    private String label;
    private String value;
    private String helper;
}
