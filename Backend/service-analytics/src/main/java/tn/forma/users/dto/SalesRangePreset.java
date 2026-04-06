package tn.forma.users.dto;

public enum SalesRangePreset {
    THIS_WEEK,
    THIS_MONTH,
    LAST_30_DAYS,
    LAST_90_DAYS;

    public static SalesRangePreset fromNullable(String value) {
        if (value == null || value.isBlank()) {
            return LAST_30_DAYS;
        }

        try {
            return SalesRangePreset.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            return LAST_30_DAYS;
        }
    }
}
