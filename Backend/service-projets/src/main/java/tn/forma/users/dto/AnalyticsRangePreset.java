package tn.forma.users.dto;

import java.util.Arrays;

public enum AnalyticsRangePreset {
    LAST_7_DAYS,
    LAST_30_DAYS,
    LAST_90_DAYS;

    public static AnalyticsRangePreset fromNullable(String raw) {
        if (raw == null || raw.isBlank()) {
            return LAST_30_DAYS;
        }

        return Arrays.stream(values())
                .filter(value -> value.name().equalsIgnoreCase(raw.trim()))
                .findFirst()
                .orElse(LAST_30_DAYS);
    }
}
