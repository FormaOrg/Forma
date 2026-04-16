package tn.forma.users.model;

import java.util.Arrays;

public enum ProjectAnalyticsEventType {
    PAGE_VIEW,
    INQUIRY_SUBMITTED;

    public static ProjectAnalyticsEventType fromNullable(String raw) {
        if (raw == null || raw.isBlank()) {
            return PAGE_VIEW;
        }

        return Arrays.stream(values())
                .filter(value -> value.name().equalsIgnoreCase(raw.trim()))
                .findFirst()
                .orElse(PAGE_VIEW);
    }
}
