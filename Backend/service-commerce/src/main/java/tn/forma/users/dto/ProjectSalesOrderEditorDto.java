package tn.forma.users.dto;

import lombok.Builder;

import java.math.BigDecimal;
import java.util.List;

@Builder
public record ProjectSalesOrderEditorDto(
        Long id,
        Long customerId,
        String orderNumber,
        String customerName,
        String placedAt,
        String scheduledFor,
        String deliveredAt,
        String paymentStatus,
        String fulfillmentStatus,
        BigDecimal subtotal,
        BigDecimal deliveryFee,
        BigDecimal total,
        String deliveryAddress,
        String notes,
        List<ProjectSalesOrderItemEditorDto> items
) {
}
