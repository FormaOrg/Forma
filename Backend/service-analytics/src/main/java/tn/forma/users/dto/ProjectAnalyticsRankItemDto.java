package tn.forma.users.dto;

import lombok.Builder;

@Builder
public record ProjectAnalyticsRankItemDto(
        String title,
        String subtitle,
        String value,
        String meta
) {
}
