package tn.forma.users.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserStatsResponse {

    private Long userId;
    private String username;

    // ── Article stats (populated by article service) ───────
    private Integer totalArticles;
    private Integer publishedArticles;
    private Integer draftArticles;
    private Long totalArticleViews;
    private Double averageViewsPerArticle;

    // ── Profile stats ──────────────────────────────────────
    private Long profileViews;

    // ── Activity ───────────────────────────────────────────
    private LocalDateTime lastArticleCreated;
    private LocalDateTime lastLogin;
    private LocalDateTime memberSince;

    // ── Most viewed article (populated by article service) ─
    private PopularArticle mostViewedArticle;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PopularArticle {
        private Long id;
        private String title;
        private String category;
        private Long viewCount;
        private LocalDateTime createdAt;
    }
}