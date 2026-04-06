package tn.forma.users.dto;

import lombok.Builder;

import java.math.BigDecimal;

@Builder
public record ProjectSalesOrderItemEditorDto(
        Long id,
        Long productId,
        String productName,
        String productSku,
        Integer quantity,
        BigDecimal unitPrice,
        BigDecimal lineTotal
) {
}
