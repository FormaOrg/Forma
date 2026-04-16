package tn.forma.users.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PortfolioInquiryDto {
    private Long id;
    private String name;
    private String email;
    private String serviceLabel;
    private String budgetLabel;
    private String status;
    private String statusLabel;
    private String sourceLabel;
    private String message;
    private String createdAt;
    private String updatedAt;
}
