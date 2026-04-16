package tn.forma.users.dto;

public record ProjectBlogCategoryDto(
        String id,
        String name,
        String description,
        String pillarLabel,
        int postCount,
        int draftCount,
        String shareLabel,
        String state,
        String stateLabel,
        String cadenceLabel,
        String nextAngle
) {
}
