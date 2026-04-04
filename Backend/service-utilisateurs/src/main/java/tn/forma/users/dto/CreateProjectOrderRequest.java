package tn.forma.users.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class CreateProjectOrderRequest {

    @NotBlank
    @Size(max = 60)
    private String orderNumber;

    private Long customerId;

    @NotNull
    private LocalDateTime placedAt;

    private LocalDateTime scheduledFor;

    private LocalDateTime deliveredAt;

    @NotBlank
    private String paymentStatus;

    @NotBlank
    private String fulfillmentStatus;

    @NotNull
    @DecimalMin("0.00")
    private BigDecimal deliveryFee;

    @Size(max = 255)
    private String deliveryAddress;

    @Size(max = 1000)
    private String notes;

    @Valid
    @NotEmpty
    private List<ProjectSalesOrderItemInputDto> items = new ArrayList<>();
}
