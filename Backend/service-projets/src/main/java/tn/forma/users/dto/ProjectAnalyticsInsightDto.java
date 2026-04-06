package tn.forma.users.dto;

import lombok.Builder;

@Builder
public record ProjectAnalyticsInsightDto(
        String title,
        String body
) {
}
