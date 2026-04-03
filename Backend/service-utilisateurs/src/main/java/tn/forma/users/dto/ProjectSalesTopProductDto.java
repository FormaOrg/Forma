package tn.forma.users.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectSalesTopProductDto {
    private Long productId;
    private String name;
    private String sku;
    private BigDecimal revenue;
    private long units;
    private double growthPercent;
}
