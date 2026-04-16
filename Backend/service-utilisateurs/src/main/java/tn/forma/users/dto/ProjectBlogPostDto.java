package tn.forma.users.dto;

public record ProjectBlogPostDto(
        String id,
        String title,
        String excerpt,
        String status,
        String statusLabel,
        String categoryLabel,
        String readTimeLabel,
        String viewsLabel,
        String updatedLabel,
        String hook,
        String seoTitle,
        String distributionLabel
) {
}
