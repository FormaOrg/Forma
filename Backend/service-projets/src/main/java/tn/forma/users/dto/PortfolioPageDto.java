package tn.forma.users.dto;

import lombok.Builder;

@Builder
public record PortfolioPageDto(
        Long id,
        String title,
        String slug,
        String description,
        String status,
        String statusLabel,
        int sectionCount,
        String seoLabel,
        String updatedAt,
        boolean featured
) {
}
