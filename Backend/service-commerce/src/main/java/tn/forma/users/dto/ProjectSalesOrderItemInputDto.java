package tn.forma.users.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class ProjectSalesOrderItemInputDto {

    private Long productId;

    @Size(max = 140)
    private String productName;

    @Size(max = 80)
    private String productSku;

    @Min(1)
    private Integer quantity;

    @DecimalMin("0.00")
    private BigDecimal unitPrice;
}
