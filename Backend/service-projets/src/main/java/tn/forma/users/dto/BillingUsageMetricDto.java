package tn.forma.users.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class BillingUsageMetricDto {
    private String label;
    private long used;
    private Long limit;
    private String unit;
    private String note;
}
