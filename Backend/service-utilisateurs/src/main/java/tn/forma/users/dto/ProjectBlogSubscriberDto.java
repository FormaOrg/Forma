package tn.forma.users.dto;

public record ProjectBlogSubscriberDto(
        long id,
        String name,
        String email,
        String status,
        String statusLabel,
        String sourceLabel,
        String tagLabel,
        String joinedLabel,
        String openRateLabel,
        String lastTouchLabel
) {
}
