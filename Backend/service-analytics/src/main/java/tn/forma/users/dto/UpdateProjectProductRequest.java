package tn.forma.users.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import tn.forma.users.model.ProjectProductStatus;
import tn.forma.users.model.ProjectProductType;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
public class UpdateProjectProductRequest {

    @Size(max = 140)
    private String name;

    @Size(max = 2000)
    private String description;

    @Size(max = 80)
    private String sku;

    @Size(max = 120)
    private String category;

    private ProjectProductType productType;

    private ProjectProductStatus status;

    @DecimalMin("0.00")
    private BigDecimal price;

    @DecimalMin("0.00")
    private BigDecimal compareAtPrice;

    @Min(0)
    private Integer inventoryQuantity;

    @Size(max = 1024)
    private String imageUrl;

    private List<@Size(max = 32) String> tags;
}
