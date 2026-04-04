package tn.forma.users.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ProjectCustomersSummaryDto {
    private int totalCustomers;
    private long repeatCustomers;
    private long recentCustomers;
    private long activeZones;
}
