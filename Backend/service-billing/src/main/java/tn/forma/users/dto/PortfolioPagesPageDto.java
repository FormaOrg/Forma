package tn.forma.users.dto;

import lombok.Builder;

import java.util.List;

@Builder
public record PortfolioPagesPageDto(
        Long projectId,
        String projectName,
        List<PortfolioPageDto> pages
) {
}
