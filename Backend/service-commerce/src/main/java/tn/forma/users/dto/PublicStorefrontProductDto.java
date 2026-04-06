package tn.forma.users.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import tn.forma.users.model.ProjectProductType;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PublicStorefrontProductDto {
    private Long id;
    private String name;
    private String description;
    private String sku;
    private String category;
    private ProjectProductType productType;
    private BigDecimal price;
    private BigDecimal compareAtPrice;
    private Integer inventoryQuantity;
    private String imageUrl;
    private List<String> tags;
    private String createdAt;
    private String updatedAt;
}
