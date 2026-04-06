package tn.forma.users.model;

import java.util.Arrays;

public enum ProjectAnalyticsDeviceType {
    DESKTOP("Desktop"),
    MOBILE("Mobile"),
    TABLET("Tablet"),
    OTHER("Other");

    private final String displayLabel;

    ProjectAnalyticsDeviceType(String displayLabel) {
        this.displayLabel = displayLabel;
    }

    public String getDisplayLabel() {
        return displayLabel;
    }

    public static ProjectAnalyticsDeviceType fromNullable(String raw) {
        if (raw == null || raw.isBlank()) {
            return OTHER;
        }

        return Arrays.stream(values())
                .filter(value -> value.name().equalsIgnoreCase(raw.trim()))
                .findFirst()
                .orElse(OTHER);
    }
}
