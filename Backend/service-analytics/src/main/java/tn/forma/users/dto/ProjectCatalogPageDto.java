package tn.forma.users.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectCatalogPageDto {
    private ProjectCatalogSummaryDto summary;
    private List<ProjectCatalogProductDto> products;
    private List<String> categories;
}
