package tn.forma.users.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectCatalogSummaryDto {
    private int totalProducts;
    private int activeProducts;
    private int draftProducts;
    private int archivedProducts;
    private int lowStockProducts;
    private int readyToPublishProducts;
}
