package tn.forma.users.dto;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class ProjectCustomerDto {
    private Long id;
    private String firstName;
    private String lastName;
    private String fullName;
    private String email;
    private String phone;
    private String address;
    private String zoneLabel;
    private long totalOrders;
    private BigDecimal totalSpent;
    private String lastOrderAt;
    private String createdAt;
    private String updatedAt;
}
