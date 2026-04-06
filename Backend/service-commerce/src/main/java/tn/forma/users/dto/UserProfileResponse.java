package tn.forma.users.dto;

import java.time.LocalDateTime;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponse {

    private Long userId;
    private String username;        // firstName + lastName
    private String displayName;
    private String email;
    private String role;
    private Boolean isActive;
    private Boolean emailVerified;

    // ── Profile ────────────────────────────────────────────
    private String avatarUrl;
    private String coverImageUrl;
    private String bio;
    private String occupation;
    private String location;

    // ── Social links ───────────────────────────────────────
    private String website;
    private String githubUrl;
    private String linkedinUrl;
    private String twitterUrl;

    // ── Statistics ─────────────────────────────────────────
    private Long totalArticleViews;
    private Integer totalArticlesPublished;
    private Long profileViews;

    // ── Dates ──────────────────────────────────────────────
    private LocalDateTime memberSince;
    private LocalDateTime lastLogin;

    // ── Recent articles (populated by article service) ─────
    private List<ArticleSummary> recentArticles;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ArticleSummary {
        private Long id;
        private String title;
        private String coverImageUrl;
        private String category;
        private Long viewCount;
        private String status;
        private LocalDateTime createdAt;
    }
}