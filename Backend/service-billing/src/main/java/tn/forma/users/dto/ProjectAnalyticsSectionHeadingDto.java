package tn.forma.users.dto;

import lombok.Builder;

@Builder
public record ProjectAnalyticsSectionHeadingDto(
        String kicker,
        String title
) {
}
