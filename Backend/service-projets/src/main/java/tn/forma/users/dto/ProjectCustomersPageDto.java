package tn.forma.users.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class ProjectCustomersPageDto {
    private ProjectCustomersSummaryDto summary;
    private List<ProjectCustomerDto> customers;
    private List<String> zones;
}
