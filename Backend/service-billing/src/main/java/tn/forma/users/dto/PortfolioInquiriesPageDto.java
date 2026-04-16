package tn.forma.users.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class PortfolioInquiriesPageDto {
    private Long projectId;
    private String projectName;
    private List<PortfolioInquiryDto> inquiries;
}
