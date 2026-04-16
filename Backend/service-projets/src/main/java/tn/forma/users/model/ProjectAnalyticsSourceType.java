package tn.forma.users.model;

import java.util.Arrays;

public enum ProjectAnalyticsSourceType {
    DIRECT("Direct"),
    SEARCH("Search"),
    SOCIAL("Social"),
    REFERRAL("Referral"),
    OTHER("Other");

    private final String displayLabel;

    ProjectAnalyticsSourceType(String displayLabel) {
        this.displayLabel = displayLabel;
    }

    public String getDisplayLabel() {
        return displayLabel;
    }

    public static ProjectAnalyticsSourceType fromNullable(String raw) {
        if (raw == null || raw.isBlank()) {
            return OTHER;
        }

        return Arrays.stream(values())
                .filter(value -> value.name().equalsIgnoreCase(raw.trim()))
                .findFirst()
                .orElse(OTHER);
    }
}
