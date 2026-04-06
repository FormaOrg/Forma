package tn.forma.users.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import tn.forma.users.model.ProjectProductStatus;
import tn.forma.users.model.ProjectProductType;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectCatalogProductDto {
    private Long id;
    private String name;
    private String description;
    private String sku;
    private String category;
    private ProjectProductType productType;
    private ProjectProductStatus status;
    private BigDecimal price;
    private BigDecimal compareAtPrice;
    private Integer inventoryQuantity;
    private String imageUrl;
    private List<String> tags;
    private boolean readyToPublish;
    private List<String> readinessIssues;
    private String createdAt;
    private String updatedAt;
}
